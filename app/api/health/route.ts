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
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: 'unhealthy',
        db: 'error',
        responseMs: Date.now() - startedAt,
      },
      { status: 503 }
    );
  }
}
