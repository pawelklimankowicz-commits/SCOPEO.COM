import { BASE_YEAR_RECALCULATION_POLICY } from '@/lib/base-year-recalculation-policy';
import { formatBoundaryApproachLabel } from '@/lib/ghg-report-boundary-label';
import type { GhgReportDocumentData } from '@/lib/ghg-report-pdf';

export type GhgReportComputedInput = {
  scope1: number;
  scope2: number;
  scope3: number;
  totalKg: number;
  byCategory: Record<string, number>;
  lineCount: number;
  dataQuality?: GhgReportDocumentData['dataQuality'];
  scope3Completeness?: GhgReportDocumentData['scope3Completeness'];
  evidenceTrail?: GhgReportDocumentData['evidenceTrail'];
  scope2LocationKg?: number;
  scope2MarketKg?: number;
  scope2Breakdown?: {
    locationBasedKg?: number;
    marketBasedKg?: number;
  };
};

type ProfileLike = Pick<GhgReportDocumentData, 'companyName' | 'baseYear' | 'boundaryApproach' | 'industry'>;

type LatestRecalc = {
  previousBaseYear: number;
  newBaseYear: number;
  triggerType: string;
  reason: string;
  approvedAt: Date;
  authorEmail: string | null;
  authorUserId: string | null;
  impactSummaryJson: Record<string, unknown> | null;
};

export type BuildGhgReportDocumentDataInput = {
  profile: ProfileLike;
  /** Rok w naglowku raportu (np. z parametru API lub profilu). */
  reportingYear: number;
  computed: GhgReportComputedInput;
  generatedAt?: string;
  snapshot?: {
    version: number | string;
    approvedAt: Date;
    authorEmail: string | null;
    authorUserId: string | null;
    hashSha256: string;
  } | null;
  latestBaseYearRecalculation?: LatestRecalc | null;
};

export function buildGhgReportDocumentData(input: BuildGhgReportDocumentDataInput): GhgReportDocumentData {
  const { profile, reportingYear, computed } = input;
  const generatedAt = input.generatedAt ?? new Date().toLocaleDateString('pl-PL');
  const scope2LocationKg = Number(computed.scope2LocationKg ?? computed.scope2Breakdown?.locationBasedKg ?? computed.scope2);
  const scope2MarketKg = Number(
    computed.scope2MarketKg ?? computed.scope2Breakdown?.marketBasedKg ?? computed.scope2
  );
  const boundaryLabel = formatBoundaryApproachLabel(profile.boundaryApproach);

  const formalReportPack: GhgReportDocumentData['formalReportPack'] = {
    methodology: [
      'Standard: GHG Protocol Corporate Standard (Corporate Accounting and Reporting Standard).',
      'Podejscie obliczeniowe: activity-based i spend-based, zaleznie od dostepnosci danych zrodlowych.',
      'Baza faktorow: KOBiZE, UK Government, EPA oraz metodyki wersjonowane w aplikacji.',
      `Scope 2 LB/MB: LB = ${scope2LocationKg.toFixed(2)} kgCO2e, MB = ${scope2MarketKg.toFixed(2)} kgCO2e.`,
    ],
    boundaries: [
      `Granica organizacyjna: ${boundaryLabel}.`,
      `Zakres raportu: Scope 1, Scope 2, Scope 3 dla roku ${reportingYear}.`,
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
      `Data Quality Score: ${(computed.dataQuality?.score ?? 100).toFixed(2)} / 100.`,
      `Flagged impact (estimated/missing/assumed): ${(computed.dataQuality?.flaggedImpactPct ?? 0).toFixed(2)}% emisji calkowitej.`,
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
  };

  const latest = input.latestBaseYearRecalculation;

  return {
    companyName: profile.companyName,
    reportingYear,
    baseYear: profile.baseYear,
    boundaryApproach: profile.boundaryApproach,
    industry: profile.industry,
    scope1: computed.scope1,
    scope2: computed.scope2,
    scope3: computed.scope3,
    totalKg: computed.totalKg,
    scope2LocationKg,
    scope2MarketKg,
    byCategory: computed.byCategory,
    linesCount: computed.lineCount,
    dataQuality: computed.dataQuality,
    scope3Completeness: computed.scope3Completeness,
    evidenceTrail: computed.evidenceTrail,
    reportNumber: input.snapshot ? `SCOPEO-SNAPSHOT-${input.snapshot.version}` : undefined,
    approvedAt: input.snapshot ? input.snapshot.approvedAt.toISOString().slice(0, 10) : undefined,
    responsiblePerson: input.snapshot?.authorEmail ?? input.snapshot?.authorUserId ?? undefined,
    snapshotHashSha256: input.snapshot?.hashSha256,
    baseYearRecalculationPolicy: BASE_YEAR_RECALCULATION_POLICY,
    latestBaseYearRecalculation: latest
      ? {
          previousBaseYear: latest.previousBaseYear,
          newBaseYear: latest.newBaseYear,
          triggerType: latest.triggerType,
          reason: latest.reason,
          approvedAt: latest.approvedAt.toISOString().slice(0, 10),
          author: latest.authorEmail ?? latest.authorUserId ?? 'n/d',
          impactSummary: latest.impactSummaryJson ?? undefined,
        }
      : undefined,
    formalReportPack,
    generatedAt,
  };
}
