import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        status: 'healthy',
        uptimeSec: Math.round(process.uptime()),
        db: 'ok',
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
    const databaseUrlSet = Boolean((process.env.DATABASE_URL || '').trim());

    return NextResponse.json(
      {
        ok: false,
        status: 'unhealthy',
        db: 'error',
        databaseUrlSet,
        errorName: e?.name ?? 'UnknownError',
        errorCode: e?.code ?? null,
        errorMessage: (e?.message || 'Unknown database error').slice(0, 240),
        responseMs: Date.now() - startedAt,
      },
      { status: 503 }
    );
  }
}
