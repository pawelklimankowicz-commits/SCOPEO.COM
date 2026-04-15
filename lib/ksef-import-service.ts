import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { parseKsefFa3Xml } from '@/lib/ksef-xml';
import { secureRawPayload } from '@/lib/payload-security';
import { classifyInvoiceLine, classifyWithContext } from '@/lib/nlp-mapping';
import { resolveBestFactorsForCategories } from '@/lib/factor-import';
import { logger } from '@/lib/logger';
import { writeProcessingRecord } from '@/lib/privacy-register';

/** Linie zakończone review — przy re-imporcie XML nie usuwamy ich ani MappingDecision / ReviewEvent. */
const PRESERVE_DECISION_STATUSES = ['APPROVED', 'OVERRIDDEN'] as const;

function shouldPreserveDecisionStatus(status: string | undefined): boolean {
  return status != null && (PRESERVE_DECISION_STATUSES as readonly string[]).includes(status);
}

/** Dopasowanie linii faktury z XML do istniejącego rekordu (ten sam wiersz po poprawce importu). */
function lineFingerprint(line: {
  description: string;
  netValue: number;
  quantity?: number | null;
  unit?: string | null;
}) {
  const d = String(line.description).trim().toLowerCase();
  const q = line.quantity ?? '';
  const u = String(line.unit ?? '').trim().toLowerCase();
  return `${d}|${line.netValue}|${q}|${u}`;
}

export async function importKsefXmlForOrganization(input: {
  organizationId: string;
  xmlPayload: string;
  actorUserId?: string | null;
}) {
  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
  });
  const invoice = await parseKsefFa3Xml(input.xmlPayload);
  const securePayload = secureRawPayload(invoice.rawPayload);
  const supplierTaxId = invoice.sellerTaxId ?? '';
  const supplier = await prisma.supplier.upsert({
    where: {
      organizationId_name_taxId: {
        organizationId: input.organizationId,
        name: invoice.sellerName,
        taxId: supplierTaxId,
      },
    },
    update: {},
    create: { organizationId: input.organizationId, name: invoice.sellerName, taxId: supplierTaxId },
  });
  const savedInvoice = await prisma.invoice.upsert({
    where: {
      organizationId_externalId: {
        organizationId: input.organizationId,
        externalId: invoice.externalId,
      },
    },
    update: {
      number: invoice.number,
      issueDate: new Date(invoice.issueDate),
      currency: invoice.currency,
      netValue: invoice.netValue,
      grossValue: invoice.grossValue,
      rawPayload: securePayload,
      supplierId: supplier.id,
    },
    create: {
      organizationId: input.organizationId,
      supplierId: supplier.id,
      externalId: invoice.externalId,
      number: invoice.number,
      issueDate: new Date(invoice.issueDate),
      currency: invoice.currency,
      netValue: invoice.netValue,
      grossValue: invoice.grossValue,
      rawPayload: securePayload,
    },
  });

  const existingLines = await prisma.invoiceLine.findMany({
    where: { invoiceId: savedInvoice.id },
    include: { mappingDecision: true },
  });

  const regionCode = organization?.regionCode || 'PL';
  const classified = await Promise.all(
    invoice.lines.map(async (line) => {
      const fallback = classifyInvoiceLine(line);
      const contextual = await classifyWithContext(line.description, supplier.id, input.organizationId);
      return {
        line,
        cls: {
          ...fallback,
          categoryCode: contextual.categoryCode,
          confidence: contextual.confidence,
          scope: contextual.scope,
          method: contextual.method,
          activityUnit: contextual.activityUnit ?? fallback.activityUnit,
          activityValue: contextual.activityValue ?? fallback.activityValue,
          matchedTokens: contextual.matchedTokens,
        },
        reasoning: {
          source: contextual.source,
          confidence: contextual.confidence,
          reasoning: contextual.reasoning,
          matchedTokens: contextual.matchedTokens,
        },
      };
    })
  );

  type InvoiceLineImported = Prisma.InvoiceLineGetPayload<{
    include: {
      emissionFactor: { include: { emissionSource: true } };
      mappingDecision: true;
    };
  }>;

  let createdLines: InvoiceLineImported[] = [];

  if (classified.length === 0) {
    if (existingLines.length > 0) {
      const mids = [
        ...new Set(existingLines.map((l) => l.mappingDecisionId).filter(Boolean)),
      ] as string[];
      await prisma.$transaction([
        prisma.invoiceLine.deleteMany({ where: { invoiceId: savedInvoice.id } }),
        ...(mids.length
          ? [prisma.mappingDecision.deleteMany({ where: { id: { in: mids } } })]
          : []),
      ]);
    }
  } else {
    const uniqueCategories = [...new Set(classified.map((c) => c.cls.categoryCode))];
    const factorMap = await resolveBestFactorsForCategories(
      input.organizationId,
      regionCode,
      uniqueCategories
    );

    const usedExistingIds = new Set<string>();
    const classifiedToCreate: typeof classified = [];
    const updateOps: Promise<unknown>[] = [];

    for (const item of classified) {
      const fp = lineFingerprint(item.line);
      const match = existingLines.find(
        (el) =>
          el.mappingDecision &&
          shouldPreserveDecisionStatus(el.mappingDecision.status) &&
          !usedExistingIds.has(el.id) &&
          lineFingerprint(el) === fp
      );
      if (match) {
        usedExistingIds.add(match.id);
        updateOps.push(
          prisma.invoiceLine.update({
            where: { id: match.id },
            data: {
              description: item.line.description,
              quantity: item.line.quantity ?? null,
              unit: item.line.unit ?? null,
              netValue: item.line.netValue,
              currency: item.line.currency,
            },
          })
        );
      } else {
        classifiedToCreate.push(item);
      }
    }

    await Promise.all(updateOps);

    if (classifiedToCreate.length > 0) {
      const decisions = await prisma.mappingDecision.createManyAndReturn({
        data: classifiedToCreate.map(({ line, cls }) => {
          const factor = factorMap.get(cls.categoryCode) ?? null;
          return {
            organizationId: input.organizationId,
            inputText: line.description,
            normalizedText: cls.normalizedText,
            scope: cls.scope,
            categoryCode: cls.categoryCode,
            factorCode: factor?.code || 'UNRESOLVED',
            confidence: cls.confidence,
            ruleMatched: cls.ruleMatched,
            status: 'PENDING' as const,
            tokensJson: { tokens: cls.tokens, candidates: cls.candidates } as Prisma.InputJsonValue,
          };
        }),
      });

      await prisma.invoiceLine.createMany({
        data: classifiedToCreate.map(({ line, cls, reasoning }, i) => {
          const factor = factorMap.get(cls.categoryCode) ?? null;
          return {
            invoiceId: savedInvoice.id,
            emissionFactorId: factor?.id ?? null,
            mappingDecisionId: decisions[i]!.id,
            description: line.description,
            quantity: line.quantity ?? null,
            unit: line.unit ?? null,
            netValue: line.netValue,
            currency: line.currency,
            scope: cls.scope,
            categoryCode: cls.categoryCode,
            calculationMethod: cls.method,
            activityValue: cls.activityValue ?? null,
            activityUnit: cls.activityUnit ?? null,
            estimated: cls.confidence < 0.9,
            classificationReasoning: JSON.stringify(reasoning),
          };
        }),
      });
    }

    const toRemove = existingLines.filter((l) => !usedExistingIds.has(l.id));
    if (toRemove.length > 0) {
      const removeIds = toRemove.map((l) => l.id);
      const mids = [...new Set(toRemove.map((l) => l.mappingDecisionId).filter(Boolean))] as string[];
      await prisma.$transaction([
        prisma.invoiceLine.deleteMany({ where: { id: { in: removeIds } } }),
        ...(mids.length
          ? [prisma.mappingDecision.deleteMany({ where: { id: { in: mids } } })]
          : []),
      ]);
    }

    createdLines = await prisma.invoiceLine.findMany({
      where: { invoiceId: savedInvoice.id },
      include: {
        emissionFactor: { include: { emissionSource: true } },
        mappingDecision: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  logger.info({
    context: 'ksef_import',
    message: 'Imported invoice lines',
    organizationId: input.organizationId,
    invoiceId: savedInvoice.id,
    lines: createdLines.length,
  });
  await writeProcessingRecord({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    eventType: 'KSEF_IMPORT',
    subjectRef: invoice.sellerTaxId ?? invoice.sellerName,
    legalBasis: 'art. 6 ust. 1 lit. b RODO',
    payload: { invoiceId: savedInvoice.id, lines: createdLines.length },
  });

  return { invoice: savedInvoice, lines: createdLines };
}
