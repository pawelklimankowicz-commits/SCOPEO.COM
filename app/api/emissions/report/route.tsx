import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { auth } from '@/lib/auth';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import {
  buildGhgReportDocumentData,
  normalizeGhgReportPdfToMaxPages,
  type GhgReportComputedInput,
} from '@/lib/ghg-report-document-data';
import { GhgReportDocument } from '@/lib/ghg-report-pdf';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = (session.user as { organizationId?: string }).organizationId as string;
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`ghg-report:${organizationId}:${ip}`, { windowMs: 5 * 60_000, maxRequests: 5 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const reportYear = Number(req.nextUrl.searchParams.get('year'));
  const validYear = Number.isFinite(reportYear) && reportYear >= 2020 && reportYear <= 2100 ? reportYear : undefined;
  const snapshotId = req.nextUrl.searchParams.get('snapshotId')?.trim() || null;

  const [profile, result, snapshot, latestBaseYearRecalculation] = await Promise.all([
    prisma.carbonProfile.findUnique({ where: { organizationId } }),
    snapshotId ? null : calculateOrganizationEmissions(organizationId, validYear, { persist: false }),
    snapshotId
      ? prisma.emissionReportSnapshot.findFirst({
          where: { id: snapshotId, organizationId },
        })
      : null,
    prisma.baseYearRecalculationLog.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'Profil organizacji nie jest skonfigurowany.' },
      { status: 400 }
    );
  }
  if (snapshotId && !snapshot) {
    return NextResponse.json({ ok: false, error: 'Snapshot not found' }, { status: 404 });
  }
  const snapshotPayload = snapshot?.payloadJson as
    | {
        byCategory?: Record<string, number>;
        lineCount?: number;
        dataQuality?: unknown;
        scope3Completeness?: unknown;
        scope2Breakdown?: {
          locationBasedKg?: number;
          marketBasedKg?: number;
          supportsMarketBased?: boolean;
          hasGreenContracts?: boolean;
          deltaKg?: number;
          totalLocationBasedKg?: number;
          totalMarketBasedKg?: number;
        };
        evidenceTrail?: unknown;
      }
    | undefined;
  const computed = snapshot
    ? {
        scope1: snapshot.scope1Kg,
        scope2: snapshot.scope2Kg,
        scope3: snapshot.scope3Kg,
        totalKg: snapshot.totalKg,
        byCategory: snapshotPayload?.byCategory ?? {},
        lineCount: snapshotPayload?.lineCount ?? 0,
        dataQuality: snapshotPayload?.dataQuality,
        scope3Completeness: snapshotPayload?.scope3Completeness,
        scope2Breakdown: snapshotPayload?.scope2Breakdown,
        evidenceTrail: snapshotPayload?.evidenceTrail,
      }
    : result!;

  const reportData = buildGhgReportDocumentData({
    profile: {
      companyName: profile.companyName,
      baseYear: profile.baseYear,
      boundaryApproach: profile.boundaryApproach,
      industry: profile.industry,
    },
    reportingYear: validYear ?? profile.reportingYear,
    computed: computed as GhgReportComputedInput,
    snapshot: snapshot
      ? {
          version: snapshot.version,
          approvedAt: snapshot.approvedAt,
          authorEmail: snapshot.authorEmail,
          authorUserId: snapshot.authorUserId,
          hashSha256: snapshot.hashSha256,
        }
      : null,
    latestBaseYearRecalculation: latestBaseYearRecalculation
      ? {
          previousBaseYear: latestBaseYearRecalculation.previousBaseYear,
          newBaseYear: latestBaseYearRecalculation.newBaseYear,
          triggerType: latestBaseYearRecalculation.triggerType,
          reason: latestBaseYearRecalculation.reason,
          approvedAt: latestBaseYearRecalculation.approvedAt,
          authorEmail: latestBaseYearRecalculation.authorEmail,
          authorUserId: latestBaseYearRecalculation.authorUserId,
          impactSummaryJson: (latestBaseYearRecalculation.impactSummaryJson ?? null) as Record<string, unknown> | null,
        }
      : null,
    generatedAt: new Date().toLocaleDateString('pl-PL'),
  });

  const doc = <GhgReportDocument data={reportData} />;

  const pdfBuffer = await renderToBuffer(doc);
  const normalizedPdfBuffer = await normalizeGhgReportPdfToMaxPages(Buffer.from(pdfBuffer), 3);

  const filename = `raport-ghg-${profile.companyName
    .replace(/\s+/g, '-')
    .toLowerCase()}-${validYear ?? profile.reportingYear}.pdf`;

  return new NextResponse(new Uint8Array(normalizedPdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
