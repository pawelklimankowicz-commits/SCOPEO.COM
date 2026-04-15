import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
