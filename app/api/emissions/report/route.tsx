import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { auth } from '@/lib/auth';
import { calculateOrganizationEmissions } from '@/lib/emissions';
import { GhgReportDocument } from '@/lib/ghg-report-pdf';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { BASE_YEAR_RECALCULATION_POLICY } from '@/lib/base-year-recalculation';

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

  const doc = (
    <GhgReportDocument
      data={{
        companyName: profile.companyName,
        reportingYear: validYear ?? profile.reportingYear,
        baseYear: profile.baseYear,
        boundaryApproach: profile.boundaryApproach,
        industry: profile.industry,
        scope1: computed.scope1,
        scope2: computed.scope2,
        scope3: computed.scope3,
        totalKg: computed.totalKg,
        scope2LocationKg: (computed as any).scope2LocationKg ?? computed.scope2,
        scope2MarketKg:
          (computed as any).scope2MarketKg ??
          (computed as any).scope2Breakdown?.marketBasedKg ??
          computed.scope2,
        byCategory: computed.byCategory,
        linesCount: computed.lineCount,
        dataQuality: computed.dataQuality as any,
        scope3Completeness: (computed as any).scope3Completeness,
        evidenceTrail: computed.evidenceTrail as any,
        reportNumber: snapshot ? `SCOPEO-SNAPSHOT-${snapshot.version}` : undefined,
        approvedAt: snapshot?.approvedAt.toISOString().slice(0, 10),
        responsiblePerson: snapshot?.authorEmail ?? snapshot?.authorUserId,
        snapshotHashSha256: snapshot?.hashSha256,
        baseYearRecalculationPolicy: BASE_YEAR_RECALCULATION_POLICY,
        latestBaseYearRecalculation: latestBaseYearRecalculation
          ? {
              previousBaseYear: latestBaseYearRecalculation.previousBaseYear,
              newBaseYear: latestBaseYearRecalculation.newBaseYear,
              triggerType: latestBaseYearRecalculation.triggerType,
              reason: latestBaseYearRecalculation.reason,
              approvedAt: latestBaseYearRecalculation.approvedAt.toISOString().slice(0, 10),
              author: latestBaseYearRecalculation.authorEmail ?? latestBaseYearRecalculation.authorUserId,
              impactSummary: latestBaseYearRecalculation.impactSummaryJson as Record<string, unknown>,
            }
          : undefined,
        formalReportPack: {
          methodology: [
            'Standard: GHG Protocol Corporate Standard (Corporate Accounting and Reporting Standard).',
            'Podejscie obliczeniowe: activity-based i spend-based, zaleznie od dostepnosci danych zrodlowych.',
            'Baza faktorow: KOBiZE, UK Government, EPA oraz metodyki wersjonowane w aplikacji.',
            `Scope 2 LB/MB: LB = ${((computed as any).scope2LocationKg ?? computed.scope2).toFixed(2)} kgCO2e, MB = ${(((computed as any).scope2MarketKg ?? (computed as any).scope2Breakdown?.marketBasedKg ?? computed.scope2)).toFixed(2)} kgCO2e.`,
          ],
          boundaries: [
            `Granica organizacyjna: ${profile.boundaryApproach}.`,
            `Zakres raportu: Scope 1, Scope 2, Scope 3 dla roku ${validYear ?? profile.reportingYear}.`,
            `Branza i kontekst operacyjny: ${profile.industry}.`,
            `Liczba przeanalizowanych pozycji danych: ${computed.lineCount}.`,
          ],
          exclusions: [
            'Emisje nieudokumentowane fakturowo lub nieudostepnione przez organizacje moga byc poza zakresem.',
            'Dane dostawcow/kontrahentow nieprzekazane do raportowania nie sa ujete w calosci.',
            'Pozycje bez wiarygodnego mapowania kategorii lub bez wymaganych atrybutow moga byc klasyfikowane ostroznie lub pomijane.',
          ],
          uncertainty: [
            'Wynik ma poziom niepewnosci zalezny od jakosci danych zrodlowych i przypisania wspolczynnikow.',
            `Data Quality Score: ${(computed as any).dataQuality?.score?.toFixed?.(2) ?? '100.00'} / 100.`,
            `Flagged impact (estimated/missing/assumed): ${((computed as any).dataQuality?.flaggedImpactPct ?? 0).toFixed(2)}% emisji calkowitej.`,
          ],
          responsibility: [
            'Za kompletność i rzetelnosc danych wejsciowych odpowiada raportujaca organizacja.',
            'Scopeo odpowiada za przetwarzanie danych i kalkulacje zgodnie z zadeklarowana metodyka.',
            'Zmiany metodyki i rekalkulacje roku bazowego sa dokumentowane w formalnym rejestrze.',
          ],
          assuranceStatus: [
            'Status raportu: contractor-ready management report.',
            'External assurance: not performed (brak niezaleznej weryfikacji strony trzeciej na moment wydania).',
            'W przypadku wymogu kontrahenta zalecane jest wykonanie limited/reasonable assurance przez podmiot niezalezny.',
          ],
        },
        generatedAt: new Date().toLocaleDateString('pl-PL'),
      }}
    />
  );

  const pdfBuffer = await renderToBuffer(doc);
  const renderedPdf = await PDFDocument.load(pdfBuffer);
  while (renderedPdf.getPageCount() > 3) {
    renderedPdf.removePage(renderedPdf.getPageCount() - 1);
  }
  const normalizedPdfBuffer = await renderedPdf.save();

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
