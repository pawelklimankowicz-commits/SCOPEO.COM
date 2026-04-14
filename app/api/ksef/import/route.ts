import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { importInvoicesSchema } from '@/lib/schema';
import { parseKsefFa3Xml } from '@/lib/ksef-xml';
import { classifyInvoiceLine } from '@/lib/nlp-mapping';
import { resolveBestFactor } from '@/lib/factor-import';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { isRawPayloadEncryptionConfigured, secureRawPayload } from '@/lib/payload-security';
import { logger } from '@/lib/logger';
import { writeProcessingRecord } from '@/lib/privacy-register';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  if (!isRawPayloadEncryptionConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'KSeF import is disabled until DATA_ENCRYPTION_KEY is configured' },
      { status: 503 }
    );
  }
  const ip = getClientIp(req.headers);
  const limit = checkRateLimit(`ksef-import:${organizationId}:${ip}`, {
    windowMs: 60_000,
    max: 15,
    blockMs: 5 * 60_000,
  });
  if (!limit.ok) {
    logger.warn({ context: 'ksef_import', message: 'Rate limited import request', organizationId, ip });
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }
  try {
    const body = await req.json();
    const parsed = importInvoicesSchema.parse(body);
    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    const invoice = await parseKsefFa3Xml(parsed.xml);
    const securePayload = secureRawPayload(invoice.rawPayload);
    const supplierTaxId = invoice.sellerTaxId ?? '';
    const supplier = await prisma.supplier.upsert({
      where: { organizationId_name_taxId: { organizationId, name: invoice.sellerName, taxId: supplierTaxId } },
      update: {},
      create: { organizationId, name: invoice.sellerName, taxId: supplierTaxId },
    });
    const savedInvoice = await prisma.invoice.upsert({ where: { organizationId_externalId: { organizationId, externalId: invoice.externalId } }, update: { number: invoice.number, issueDate: new Date(invoice.issueDate), currency: invoice.currency, netValue: invoice.netValue, grossValue: invoice.grossValue, rawPayload: securePayload, supplierId: supplier.id, lines: { deleteMany: {} } }, create: { organizationId, supplierId: supplier.id, externalId: invoice.externalId, number: invoice.number, issueDate: new Date(invoice.issueDate), currency: invoice.currency, netValue: invoice.netValue, grossValue: invoice.grossValue, rawPayload: securePayload } });
    const createdLines = [] as any[];
    for (const line of invoice.lines) {
      const cls = classifyInvoiceLine(line);
      const factor = await resolveBestFactor(organizationId, organization?.regionCode || 'PL', cls.categoryCode);
      const decision = await prisma.mappingDecision.create({ data: { organizationId, inputText: line.description, normalizedText: cls.normalizedText, scope: cls.scope, categoryCode: cls.categoryCode, factorCode: factor?.code || 'UNRESOLVED', confidence: cls.confidence, ruleMatched: cls.ruleMatched, status: 'PENDING', tokensJson: { tokens: cls.tokens, candidates: cls.candidates } as any } });
      const created = await prisma.invoiceLine.create({ data: { invoiceId: savedInvoice.id, emissionFactorId: factor?.id, mappingDecisionId: decision.id, description: line.description, quantity: line.quantity ?? null, unit: line.unit ?? null, netValue: line.netValue, currency: line.currency, scope: cls.scope, categoryCode: cls.categoryCode, calculationMethod: cls.method, activityValue: cls.activityValue ?? null, activityUnit: cls.activityUnit ?? null, estimated: cls.confidence < 0.9 }, include: { emissionFactor: { include: { emissionSource: true } }, mappingDecision: true } });
      createdLines.push(created);
    }
    logger.info({
      context: 'ksef_import',
      message: 'Imported invoice lines',
      organizationId,
      invoiceId: savedInvoice.id,
      lines: createdLines.length,
    });
    await writeProcessingRecord({
      organizationId,
      actorUserId: session.user.id as string,
      eventType: 'KSEF_IMPORT',
      subjectRef: invoice.sellerTaxId ?? invoice.sellerName,
      legalBasis: 'art. 6 ust. 1 lit. b RODO',
      payload: { invoiceId: savedInvoice.id, lines: createdLines.length },
    });
    return NextResponse.json({ ok: true, invoice: savedInvoice, lines: createdLines });
  } catch (error) {
    logger.error({
      context: 'ksef_import',
      message: 'Failed to import KSeF XML',
      organizationId,
      ip,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}