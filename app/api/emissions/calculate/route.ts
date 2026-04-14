import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import { checkRateLimit } from '@/lib/security';
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const organizationId = (session.user as any).organizationId as string;
    const limit = await checkRateLimit(`emissions-calc:${organizationId}`, {
      windowMs: 60_000,
      maxRequests: 20,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }
    const body = await req.json().catch(() => ({}));
    const reportYear = Number(body?.reportYear);
    const validReportYear =
      Number.isFinite(reportYear) && reportYear >= 2000 && reportYear <= 2100 ? reportYear : undefined;
    const result = await calculateOrganizationEmissions(organizationId, validReportYear);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}