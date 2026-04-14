import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import { checkRateLimit } from '@/lib/security';
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const organizationId = (session.user as any).organizationId as string;
    const limit = checkRateLimit(`emissions-calc:${organizationId}`, { windowMs: 60_000, max: 20 });
    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }
    const result = await calculateOrganizationEmissions(organizationId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}