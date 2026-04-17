import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createBaseYearRecalculationLog, BASE_YEAR_RECALCULATION_POLICY } from '@/lib/base-year-recalculation';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';

function canManageRecalculation(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = (session.user as { organizationId?: string }).organizationId as string;
  const role = (session.user as { role?: string }).role;
  if (!canManageRecalculation(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw)) : 50;

  const logs = await prisma.baseYearRecalculationLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({
    ok: true,
    policy: BASE_YEAR_RECALCULATION_POLICY,
    logs,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!canManageRecalculation(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = (session.user as { organizationId?: string }).organizationId as string;
  const ip = getClientIp(req.headers);
  const limit = await checkRateLimit(`base-year-recalculation:${organizationId}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const previousBaseYearRaw = Number(body?.previousBaseYear);
  const newBaseYearRaw = Number(body?.newBaseYear);
  const triggerType = String(body?.triggerType ?? '').trim();
  const reason = String(body?.reason ?? '').trim();

  if (!Number.isFinite(previousBaseYearRaw) || previousBaseYearRaw < 2000 || previousBaseYearRaw > 2100) {
    return NextResponse.json({ ok: false, error: 'Invalid previousBaseYear' }, { status: 400 });
  }
  if (!Number.isFinite(newBaseYearRaw) || newBaseYearRaw < 2000 || newBaseYearRaw > 2100) {
    return NextResponse.json({ ok: false, error: 'Invalid newBaseYear' }, { status: 400 });
  }
  if (!triggerType) {
    return NextResponse.json({ ok: false, error: 'triggerType is required' }, { status: 400 });
  }
  if (!reason || reason.length < 10) {
    return NextResponse.json({ ok: false, error: 'reason must be at least 10 characters' }, { status: 400 });
  }
  if (previousBaseYearRaw === newBaseYearRaw) {
    return NextResponse.json({ ok: false, error: 'newBaseYear must differ from previousBaseYear' }, { status: 400 });
  }

  const result = await createBaseYearRecalculationLog({
    organizationId,
    authorUserId: String((session.user as { id?: string }).id ?? ''),
    authorEmail: (session.user as { email?: string }).email ?? null,
    previousBaseYear: previousBaseYearRaw,
    newBaseYear: newBaseYearRaw,
    triggerType,
    reason,
  });

  return NextResponse.json({
    ok: true,
    policy: BASE_YEAR_RECALCULATION_POLICY,
    log: result.logEntry,
    impactSummary: result.impactSummary,
  });
}
