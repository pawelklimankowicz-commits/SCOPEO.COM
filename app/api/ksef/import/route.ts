import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { importInvoicesSchema } from '@/lib/schema';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { isRawPayloadEncryptionConfigured } from '@/lib/payload-security';
import { logger } from '@/lib/logger';
import { importKsefXmlForOrganization } from '@/lib/ksef-import-service';

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
    if (parsed.ksefReferenceNumber && !parsed.xml) {
      const job = await prisma.ksefImportJob.create({
        data: {
          organizationId,
          actorUserId: session.user.id as string,
          referenceNumber: parsed.ksefReferenceNumber,
          status: 'PENDING',
          nextAttemptAt: new Date(),
          payloadJson: { enqueuedBy: 'api/ksef/import' } as any,
        },
      });
      return NextResponse.json({ ok: true, queued: true, jobId: job.id, status: job.status });
    }
    if (!parsed.xml) {
      return NextResponse.json({ ok: false, error: 'Missing XML payload' }, { status: 400 });
    }
    const imported = await importKsefXmlForOrganization({
      organizationId,
      xmlPayload: parsed.xml,
      actorUserId: session.user.id as string,
    });
    return NextResponse.json({ ok: true, invoice: imported.invoice, lines: imported.lines });
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