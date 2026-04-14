import { prisma } from '@/lib/prisma';
import { parseKsefFa3Xml } from '@/lib/ksef-xml';
import { secureRawPayload } from '@/lib/payload-security';
import { classifyInvoiceLine } from '@/lib/nlp-mapping';
import { resolveBestFactor } from '@/lib/factor-import';
import { logger } from '@/lib/logger';
import { writeProcessingRecord } from '@/lib/privacy-register';

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
      lines: { deleteMany: {} },
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

  const createdLines = [] as any[];
  for (const line of invoice.lines) {
    const cls = classifyInvoiceLine(line);
    const factor = await resolveBestFactor(
      input.organizationId,
      organization?.regionCode || 'PL',
      cls.categoryCode
    );
    const decision = await prisma.mappingDecision.create({
      data: {
        organizationId: input.organizationId,
        inputText: line.description,
        normalizedText: cls.normalizedText,
        scope: cls.scope,
        categoryCode: cls.categoryCode,
        factorCode: factor?.code || 'UNRESOLVED',
        confidence: cls.confidence,
        ruleMatched: cls.ruleMatched,
        status: 'PENDING',
        tokensJson: { tokens: cls.tokens, candidates: cls.candidates } as any,
      },
    });
    const created = await prisma.invoiceLine.create({
      data: {
        invoiceId: savedInvoice.id,
        emissionFactorId: factor?.id,
        mappingDecisionId: decision.id,
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
      },
      include: { emissionFactor: { include: { emissionSource: true } }, mappingDecision: true },
    });
    createdLines.push(created);
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
