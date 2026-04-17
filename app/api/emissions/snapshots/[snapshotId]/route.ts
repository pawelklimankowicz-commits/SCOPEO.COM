import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';

type Params = { params: Promise<{ snapshotId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { snapshotId } = await params;
  const organizationId = (session.user as { organizationId?: string }).organizationId as string;
  const ip = getClientIp(req.headers);
  const limit = await checkRateLimit(`emissions-snapshot-get:${organizationId}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 40,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const snapshot = await prisma.emissionReportSnapshot.findFirst({
    where: {
      id: snapshotId,
      organizationId,
    },
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
      payloadJson: true,
    },
  });
  if (!snapshot) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, snapshot });
}
