import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { importInvoicesSchema } from '@/lib/schema';
import { parseKsefFa3Xml } from '@/lib/ksef-xml';
import { classifyInvoiceLine } from '@/lib/nlp-mapping';
import { resolveBestFactor } from '@/lib/factor-import';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = importInvoicesSchema.parse(body);
    const organizationId = (session.user as any).organizationId as string;
    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    const invoice = await parseKsefFa3Xml(parsed.xml);
    const supplierTaxId = invoice.sellerTaxId ?? '';
    const supplier = await prisma.supplier.upsert({
      where: { organizationId_name_taxId: { organizationId, name: invoice.sellerName, taxId: supplierTaxId } },
      update: {},
      create: { organizationId, name: invoice.sellerName, taxId: supplierTaxId },
    });
    const savedInvoice = await prisma.invoice.upsert({ where: { organizationId_externalId: { organizationId, externalId: invoice.externalId } }, update: { number: invoice.number, issueDate: new Date(invoice.issueDate), currency: invoice.currency, netValue: invoice.netValue, grossValue: invoice.grossValue, rawPayload: invoice.rawPayload, supplierId: supplier.id, lines: { deleteMany: {} } }, create: { organizationId, supplierId: supplier.id, externalId: invoice.externalId, number: invoice.number, issueDate: new Date(invoice.issueDate), currency: invoice.currency, netValue: invoice.netValue, grossValue: invoice.grossValue, rawPayload: invoice.rawPayload } });
    const createdLines = [] as any[];
    for (const line of invoice.lines) {
      const cls = classifyInvoiceLine(line);
      const factor = await resolveBestFactor(organizationId, organization?.regionCode || 'PL', cls.categoryCode);
      const decision = await prisma.mappingDecision.create({ data: { organizationId, inputText: line.description, normalizedText: cls.normalizedText, scope: cls.scope, categoryCode: cls.categoryCode, factorCode: factor?.code || 'UNRESOLVED', confidence: cls.confidence, ruleMatched: cls.ruleMatched, status: 'PENDING', tokensJson: JSON.stringify({ tokens: cls.tokens, candidates: cls.candidates }) } });
      const created = await prisma.invoiceLine.create({ data: { invoiceId: savedInvoice.id, emissionFactorId: factor?.id, mappingDecisionId: decision.id, description: line.description, quantity: line.quantity ?? null, unit: line.unit ?? null, netValue: line.netValue, currency: line.currency, scope: cls.scope, categoryCode: cls.categoryCode, calculationMethod: cls.method, activityValue: cls.activityValue ?? null, activityUnit: cls.activityUnit ?? null, estimated: cls.confidence < 0.9 }, include: { emissionFactor: { include: { emissionSource: true } }, mappingDecision: true } });
      createdLines.push(created);
    }
    return NextResponse.json({ ok: true, invoice: savedInvoice, lines: createdLines });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}