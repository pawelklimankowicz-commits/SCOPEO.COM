import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const organizationId = (session.user as { organizationId?: string }).organizationId as string;
  const ip = getClientIp(req.headers);
  const limit = await checkRateLimit(`emissions-snapshots-list:${organizationId}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const takeRaw = Number(req.nextUrl.searchParams.get('take'));
  const take = Number.isFinite(takeRaw) ? Math.max(1, Math.min(50, Math.floor(takeRaw))) : 20;

  const snapshots = await prisma.emissionReportSnapshot.findMany({
    where: { organizationId },
    orderBy: { version: 'desc' },
    take,
    select: {
      id: true,
      version: true,
      reportYear: true,
      hashSha256: true,
      authorUserId: true,
      authorEmail: true,
      createdAt: true,
      approvedAt: true,
      scope1Kg: true,
      scope2Kg: true,
      scope3Kg: true,
      totalKg: true,
    },
  });

  return NextResponse.json({ ok: true, snapshots });
}
