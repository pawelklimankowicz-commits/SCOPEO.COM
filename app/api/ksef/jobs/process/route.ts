import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptKsefToken } from '@/lib/ksef-token-crypto';
import { fetchKsefInvoiceXml } from '@/lib/ksef-client';
import { importKsefXmlForOrganization } from '@/lib/ksef-import-service';
import { logger } from '@/lib/logger';

function canRunWorker(req: Request) {
  const secret = process.env.KSEF_WORKER_SECRET?.trim();
  if (!secret) return false;
  const provided = req.headers.get('x-ksef-worker-secret')?.trim();
  return provided === secret;
}

function backoffMs(attemptCount: number) {
  return Math.min(60_000 * 2 ** Math.max(0, attemptCount - 1), 30 * 60_000);
}

export async function POST(req: Request) {
  if (!canRunWorker(req)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const now = new Date();
  const jobs = await prisma.ksefImportJob.findMany({
    where: {
      status: { in: ['PENDING', 'RETRY'] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  const results: Array<{ jobId: string; status: string; error?: string }> = [];
  for (const job of jobs) {
    try {
      await prisma.ksefImportJob.update({
        where: { id: job.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date(), attemptCount: { increment: 1 } },
      });
      const profile = await prisma.carbonProfile.findUnique({
        where: { organizationId: job.organizationId },
      });
      if (!profile?.ksefTokenEncrypted) {
        throw new Error('Missing encrypted KSeF token');
      }
      const token = decryptKsefToken(profile.ksefTokenEncrypted);
      const xmlPayload = await fetchKsefInvoiceXml({
        token,
        referenceNumber: job.referenceNumber,
      });
      const imported = await importKsefXmlForOrganization({
        organizationId: job.organizationId,
        xmlPayload,
        actorUserId: job.actorUserId,
      });
      await prisma.ksefImportJob.update({
        where: { id: job.id },
        data: {
          status: 'SUCCEEDED',
          completedAt: new Date(),
          lastError: null,
          payloadJson: {
            ...(typeof job.payloadJson === 'object' && job.payloadJson ? (job.payloadJson as object) : {}),
            invoiceId: imported.invoice.id,
            lines: imported.lines.length,
          } as any,
        },
      });
      results.push({ jobId: job.id, status: 'SUCCEEDED' });
    } catch (error) {
      const latest = await prisma.ksefImportJob.findUnique({ where: { id: job.id } });
      const attempts = latest?.attemptCount ?? job.attemptCount + 1;
      const finalFailure = attempts >= job.maxAttempts;
      const message = error instanceof Error ? error.message : 'Unknown error';
      await prisma.ksefImportJob.update({
        where: { id: job.id },
        data: finalFailure
          ? {
              status: 'FAILED',
              lastError: message,
              completedAt: new Date(),
            }
          : {
              status: 'RETRY',
              lastError: message,
              nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
            },
      });
      logger.warn({
        context: 'ksef_worker',
        message: finalFailure ? 'KSeF job failed permanently' : 'KSeF job scheduled for retry',
        jobId: job.id,
        attempts,
        error: message,
      });
      results.push({ jobId: job.id, status: finalFailure ? 'FAILED' : 'RETRY', error: message });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
