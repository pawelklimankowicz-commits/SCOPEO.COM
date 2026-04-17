import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import { createImmutableReportSnapshot } from '@/lib/report-snapshots';
import { checkRateLimit, getClientIp } from '@/lib/security';

function canCloseSnapshot(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!canCloseSnapshot(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = (session.user as { organizationId?: string }).organizationId as string;
  const ip = getClientIp(req.headers);
  const limit = await checkRateLimit(`emissions-snapshot-close:${organizationId}:${ip}`, {
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
  const reportYearRaw = Number(body?.reportYear);
  const reportYear =
    Number.isFinite(reportYearRaw) && reportYearRaw >= 2000 && reportYearRaw <= 2100
      ? reportYearRaw
      : undefined;

  const result = await calculateOrganizationEmissions(organizationId, reportYear, {
    persist: false,
  });
  const snapshotResult = await createImmutableReportSnapshot({
    organizationId,
    authorUserId: String((session.user as { id?: string }).id ?? ''),
    authorEmail: (session.user as { email?: string }).email ?? null,
    reportYear,
    result,
  });

  return NextResponse.json({
    ok: true,
    created: snapshotResult.created,
    snapshot: snapshotResult.snapshot,
    totals: {
      scope1Kg: result.scope1,
      scope2Kg: result.scope2,
      scope3Kg: result.scope3,
      totalKg: result.totalKg,
    },
  });
}
