import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { importExternalFactors } from '@/lib/factor-import';
import { checkRateLimit } from '@/lib/security';
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const role = (session.user as any).role as string | null | undefined;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const limit = await checkRateLimit(`factors-import:${organizationId}`, {
    windowMs: 10 * 60_000,
    maxRequests: 3,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many import attempts' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }
  try {
    const result = await importExternalFactors(organizationId, session.user.id as string);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}