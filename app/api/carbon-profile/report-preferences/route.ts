import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  DEFAULT_AUDIT_RISK_MISSING_PCT_HIGH,
  DEFAULT_SNAPSHOT_MIN_QUALITY_SCORE,
  DEFAULT_SNAPSHOT_MIN_SCOPE3_COVERAGE_PCT,
} from '@/lib/report-quality-gates';

const patchSchema = z.object({
  reportTotalDisplayBasis: z.enum(['LB', 'MB']).optional(),
  snapshotMinQualityScore: z.number().min(0).max(100).optional(),
  snapshotMinScope3CoveragePct: z.number().min(0).max(100).optional(),
  auditRiskMissingPctHigh: z.number().min(0).max(100).optional(),
});

function isPrivilegedRole(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!isPrivilegedRole(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId = (session.user as { organizationId?: string }).organizationId as string;

  try {
    const body = patchSchema.parse(await req.json());
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ ok: false, error: 'Brak pól do aktualizacji.' }, { status: 400 });
    }
    const existing = await prisma.carbonProfile.findUnique({
      where: { organizationId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Brak profilu carbon — dokończ onboarding.' },
        { status: 404 }
      );
    }
    const profile = await prisma.carbonProfile.update({
      where: { organizationId },
      data: {
        ...(body.reportTotalDisplayBasis !== undefined
          ? { reportTotalDisplayBasis: body.reportTotalDisplayBasis }
          : {}),
        ...(body.snapshotMinQualityScore !== undefined
          ? { snapshotMinQualityScore: body.snapshotMinQualityScore }
          : {}),
        ...(body.snapshotMinScope3CoveragePct !== undefined
          ? { snapshotMinScope3CoveragePct: body.snapshotMinScope3CoveragePct }
          : {}),
        ...(body.auditRiskMissingPctHigh !== undefined
          ? { auditRiskMissingPctHigh: body.auditRiskMissingPctHigh }
          : {}),
      },
    });
    return NextResponse.json({
      ok: true,
      preferences: {
        reportTotalDisplayBasis: profile.reportTotalDisplayBasis,
        snapshotMinQualityScore: profile.snapshotMinQualityScore ?? DEFAULT_SNAPSHOT_MIN_QUALITY_SCORE,
        snapshotMinScope3CoveragePct:
          profile.snapshotMinScope3CoveragePct ?? DEFAULT_SNAPSHOT_MIN_SCOPE3_COVERAGE_PCT,
        auditRiskMissingPctHigh: profile.auditRiskMissingPctHigh ?? DEFAULT_AUDIT_RISK_MISSING_PCT_HIGH,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
