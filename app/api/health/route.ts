import { NextResponse } from 'next/server';
import { isProductionRuntime } from '@/lib/production-env';

function canViewHealthDiagnostics(req?: Request): boolean {
  const secret = process.env.HEALTH_CHECK_SECRET?.trim();
  if (!secret) return false;
  const provided = req?.headers.get('x-health-secret')?.trim();
  return Boolean(provided && provided === secret);
}

export async function GET(req?: Request) {
  const startedAt = Date.now();
  const includeDiagnostics = canViewHealthDiagnostics(req);
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        status: 'healthy',
        uptimeSec: Math.round(process.uptime()),
        db: 'ok',
        ...(includeDiagnostics
          ? {
              authSecretSet: Boolean(
                (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim()
              ),
              nextAuthUrlSet: Boolean((process.env.NEXTAUTH_URL || '').trim()),
              stripeSecretSet: Boolean((process.env.STRIPE_SECRET_KEY || '').trim()),
              cronSecretSet: Boolean((process.env.CRON_SECRET || '').trim()),
              upstashConfigured: Boolean(
                (process.env.UPSTASH_REDIS_REST_URL || '').trim() &&
                  (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
              ),
              dataEncryptionKeySet: Boolean((process.env.DATA_ENCRYPTION_KEY || '').trim()),
              ksefTokenKeySet: Boolean((process.env.KSEF_TOKEN_ENCRYPTION_KEY || '').trim()),
              productionRuntime: isProductionRuntime(),
            }
          : {}),
        responseMs: Date.now() - startedAt,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const e = error as
      | {
          name?: string;
          code?: string;
          message?: string;
        }
      | undefined;
    return NextResponse.json(
      {
        ok: false,
        status: 'unhealthy',
        db: 'error',
        ...(includeDiagnostics
          ? {
              databaseUrlSet: Boolean((process.env.DATABASE_URL || '').trim()),
              authSecretSet: Boolean(
                (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim()
              ),
              nextAuthUrlSet: Boolean((process.env.NEXTAUTH_URL || '').trim()),
              stripeSecretSet: Boolean((process.env.STRIPE_SECRET_KEY || '').trim()),
              cronSecretSet: Boolean((process.env.CRON_SECRET || '').trim()),
              upstashConfigured: Boolean(
                (process.env.UPSTASH_REDIS_REST_URL || '').trim() &&
                  (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
              ),
              dataEncryptionKeySet: Boolean((process.env.DATA_ENCRYPTION_KEY || '').trim()),
              ksefTokenKeySet: Boolean((process.env.KSEF_TOKEN_ENCRYPTION_KEY || '').trim()),
              productionRuntime: isProductionRuntime(),
              errorName: e?.name ?? 'UnknownError',
              errorCode: e?.code ?? null,
              errorMessage: (e?.message || 'Unknown database error').slice(0, 240),
            }
          : {}),
        responseMs: Date.now() - startedAt,
      },
      { status: 503 }
    );
  }
}
