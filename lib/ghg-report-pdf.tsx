import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  G,
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from '@react-pdf/renderer';
import { formatBoundaryApproachLabel } from '@/lib/ghg-report-boundary-label';

const PDF_FONT_FAMILY = process.env.DISABLE_REMOTE_PDF_FONTS === '1' ? 'Helvetica' : 'Noto Sans';

if (process.env.DISABLE_REMOTE_PDF_FONTS !== '1') {
  Font.register({
    family: 'Noto Sans',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7du3mhPy0.woff2',
        fontWeight: 'normal',
      },
      {
        src: 'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNb4j5Ba_2c7fj2AI-instr-8517694.woff2',
        fontWeight: 'bold',
      },
    ],
  });
}

const styles = StyleSheet.create({
  page: { fontFamily: PDF_FONT_FAMILY, fontSize: 10, paddingTop: 32, paddingBottom: 36, paddingHorizontal: 36, color: '#0f172a', backgroundColor: '#ffffff' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  brand: { fontSize: 11, color: '#10b981' },
  confidential: { fontSize: 8, color: '#64748b' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: '#0f172a' },
  subtitle: { fontSize: 11, color: '#334155', marginBottom: 18 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#0f172a' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: { width: '48.8%', borderWidth: 1, borderColor: '#86efac', borderRadius: 10, padding: 10, backgroundColor: '#f0fdf4' },
  summaryCardWide: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f0fdf4',
  },
  summaryDualInner: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
  },
  summaryDualInnerActive: {
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  cardLabel: { fontSize: 8, color: '#475569', marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  cardSub: { fontSize: 8, color: '#64748b', marginTop: 2 },
  narrativeBox: { borderWidth: 1, borderColor: '#86efac', borderRadius: 10, padding: 10, backgroundColor: '#f0fdf4' },
  narrativeText: { fontSize: 9, color: '#334155', lineHeight: 1.45 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#bbf7d0', borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: '#86efac' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  colCategory: { flex: 3.6, paddingRight: 6 },
  colScope: { flex: 1.2, textAlign: 'right' },
  colTons: { flex: 1.1, textAlign: 'right' },
  colShare: { flex: 1.1, textAlign: 'right' },
  pieWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#86efac', borderRadius: 10, padding: 10, backgroundColor: '#f0fdf4' },
  pieCanvas: { width: 210, alignItems: 'center', justifyContent: 'center' },
  pieLegend: { flex: 1, paddingLeft: 10 },
  pieLegendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  pieLegendDot: { width: 8, height: 8, borderRadius: 999, marginRight: 6 },
  pieLegendLabel: { flex: 1, fontSize: 8.5, color: '#1f2937' },
  pieLegendValue: { width: 70, textAlign: 'right', fontSize: 8.5, color: '#334155' },
  methodologyWrap: { borderWidth: 1, borderColor: '#86efac', borderRadius: 10, padding: 10, backgroundColor: '#f0fdf4' },
  methodologyTitle: { fontSize: 9, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  methodologyLine: { fontSize: 8.5, color: '#334155', marginBottom: 2, lineHeight: 1.4 },
  footer: { position: 'absolute', left: 36, right: 36, bottom: 18, fontSize: 7.5, color: '#64748b', textAlign: 'center' },
});

/** Limity wyswietlania w PDF (nie obcinac dokumentu do 3 stron — tracone byly listy dowodow). */
export const GHG_REPORT_PIE_TOP_N = 11;
export const GHG_REPORT_TABLE_MAX_ROWS = 30;
export const GHG_REPORT_EVIDENCE_MAX_ROWS = 30;
export const GHG_REPORT_SCOPE3_MATRIX_MAX_ROWS = 30;

export type GhgReportDocumentData = {
  companyName: string;
  reportingYear: number;
  baseYear: number;
  boundaryApproach: string;
  industry: string;
  scope1: number;
  scope2: number;
  scope2LocationKg?: number;
  scope2MarketKg?: number;
  scope3: number;
  totalKg: number;
  /** Suma Scope 1+2(LB)+3 — spójna z `totalKg` przy pełnym breakdownie. */
  totalLocationBasedKg?: number;
  /** Suma Scope 1+2(MB)+3 — wymaga włączonego MB w profilu. */
  totalMarketBasedKg?: number;
  /** Która suma jest traktowana jako „główna” w UI eksportu (podświetlenie na str. 1). */
  reportTotalDisplayBasis?: 'LB' | 'MB';
  byCategory: Record<string, number>;
  linesCount: number;
  generatedAt: string;
  dataQuality?: {
    score?: number;
    flaggedImpactKg?: number;
    flaggedImpactPct?: number;
    impactByFlagKg?: { estimated?: number; missing?: number; assumed?: number };
    impactByFlagPct?: { estimated?: number; missing?: number; assumed?: number };
    lineCountsByFlag?: { estimated?: number; missing?: number; assumed?: number };
    auditRisk?: 'none' | 'elevated' | 'high';
    auditRiskMissingPctThreshold?: number;
    auditRiskLabel?: string;
  };
  scope3Completeness?: {
    summary?: {
      coveredCount?: number;
      totalCount?: number;
      coveragePct?: number;
    };
    matrix?: Array<{
      categoryCode: string;
      categoryLabel: string;
      status: 'covered' | 'not_covered';
      coveredKg: number;
      matchedCategories: string[];
      reason: string;
    }>;
  };
  evidenceTrail?: {
    aggregateEvidence: {
      total: { evidenceId: string; valueKg: number; sourceEvidenceIds: string[] };
      scope1: { evidenceId: string; valueKg: number; sourceEvidenceIds: string[] };
      scope2: { evidenceId: string; valueKg: number; sourceEvidenceIds: string[] };
      scope2LocationBased?: { evidenceId: string; valueKg: number; sourceEvidenceIds: string[] };
      scope2MarketBased?: { evidenceId: string; valueKg: number; sourceEvidenceIds: string[] };
      scope3: { evidenceId: string; valueKg: number; sourceEvidenceIds: string[] };
      categories: Array<{
        categoryCode: string;
        evidenceId: string;
        valueKg: number;
        sourceEvidenceIds: string[];
      }>;
    };
    entries: Array<{
      evidenceId: string;
      co2eKg: number;
      scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
      categoryCode: string;
      calculationMethod: 'ACTIVITY' | 'SPEND';
      invoiceId: string;
      invoiceNumber: string;
      invoiceExternalId: string;
      invoiceIssueDate: string;
      invoiceSourceLink: string;
      lineId: string;
      lineDescription: string;
      factorId: string | null;
      factorCode: string | null;
      factorValue: number;
      factorUnit: string | null;
      methodologyVersion: string;
      emissionSourceCode: string | null;
      emissionSourceVersion: string | null;
      factorSourceLink: string | null;
    }>;
  };
  reportNumber?: string;
  approvedAt?: string;
  responsiblePerson?: string;
  contractualClause?: string;
  snapshotHashSha256?: string;
  baseYearRecalculationPolicy?: {
    standard?: string;
    version?: string;
    objective?: string;
    mandatoryTriggers?: readonly string[];
    materialityRule?: string;
    governance?: readonly string[];
  };
  latestBaseYearRecalculation?: {
    previousBaseYear: number;
    newBaseYear: number;
    triggerType: string;
    reason: string;
    approvedAt: string;
    author: string;
    impactSummary?: Record<string, unknown>;
  };
  formalReportPack?: {
    methodology: string[];
    boundaries: string[];
    exclusions: string[];
    uncertainty: string[];
    responsibility: string[];
    assuranceStatus: string[];
  };
};

function scopeLabel(s: string) {
  if (s.startsWith('scope1')) return 'Zakres 1';
  if (s.startsWith('scope2')) return 'Zakres 2';
  return 'Zakres 3';
}

function categoryLabel(code: string): string {
  const map: Record<string, string> = {
    scope1_fuel: 'Spalanie paliw (flota, kotlownia)',
    scope1_fuel_gas: 'Spalanie gazu ziemnego',
    scope2_electricity: 'Zakup energii elektrycznej',
    scope2_district_heat: 'Zakup ciepla sieciowego',
    scope3_cat1_purchased_services: 'Kat. 1: Kupione dobra i uslugi',
    scope3_cat1_purchased_goods: 'Kat. 1: Kupione materialy',
    scope3_cat2_capital_goods: 'Kat. 2: Dobra kapitalowe',
    scope3_cat4_transport: 'Kat. 4: Transport i dystrybucja (upstream)',
    scope3_cat5_waste: 'Kat. 5: Odpady z dzialalnosci',
    scope3_cat6_business_travel: 'Kat. 6: Podroze sluzbowe',
    scope3_cat3_fuel_energy: 'Kat. 3: Energia paliwowa (upstream)',
  };
  return map[code] ?? code;
}

/** 11 punktow kontrolnych widocznych zawsze w sekcji 11 (spojnosc z oczekiwanym szablonem). */
export const GHG_REPORT_CHECKLIST_11 = [
  'Granica organizacyjna i rok raportu zgodne z profilem carbon.',
  'Agregacja Scope 1 / 2 / 3 zgodna z sumami kategorii i dowodami linii.',
  'Scope 2 LB i MB, sumy calkowite organizacji LB/MB na stronie 1 oraz delta MB-LB opisane przy danych energetycznych.',
  'Kompletna tabela kategorii z udzialami procentowymi i identyfikatorami EV-CAT-*.',
  'Evidence trail: kazda pozycja raportowa mapowana do faktury, linii i metodyki.',
  'Data Quality Score i flagged impact zgodne z flagami estymacji / brakow.',
  'Macierz Scope 3: pokrycie kategorii i status covered / not covered.',
  'Formal Report Pack: metodyka, granice, wykluczenia, niepewnosc, odpowiedzialnosc, assurance.',
  'Sekcja wysylkowa: numer raportu, data, osoba, hash snapshotu (gdy dotyczy).',
  'Rejestr rekalkulacji roku bazowego lub potwierdzenie braku zmian.',
  'Pelny eksport CSV / XLSX / JSON dla audytu poza PDF (dokument roboczy).',
] as const;

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function describePieArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function ScopeoPdfBrandRow({ rightLabel }: { rightLabel: string }) {
  return (
    <View style={styles.brandRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Svg width={128} height={31} viewBox="0 0 232 56">
          <Defs>
            <LinearGradient id="pdf-scopeo-mark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#022c22" />
              <Stop offset="55%" stopColor="#064e3b" />
              <Stop offset="100%" stopColor="#0f3932" />
            </LinearGradient>
            <LinearGradient id="pdf-scopeo-mark-ring" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#ccfbf1" />
              <Stop offset="50%" stopColor="#5eead4" />
              <Stop offset="100%" stopColor="#34d399" />
            </LinearGradient>
          </Defs>
          {/* Bez <G transform> — @react-pdf/render oczekuje tablicy transformacji w stylu RN, nie stringu SVG. */}
          <Rect x={3.44} y={4.44} width={47.13} height={47.13} rx={14.63} fill="url(#pdf-scopeo-mark-bg)" />
          <Circle cx={27} cy={28} r={18.69} fill="none" stroke="#134e4a" strokeWidth={1.02} strokeOpacity={0.9} />
          <Circle
            cx={27}
            cy={28}
            r={13.41}
            fill="none"
            stroke="url(#pdf-scopeo-mark-ring)"
            strokeWidth={1.95}
            strokeLinecap="round"
          />
          <Circle
            cx={27}
            cy={28}
            r={8.13}
            fill="none"
            stroke="url(#pdf-scopeo-mark-ring)"
            strokeWidth={1.63}
            strokeLinecap="round"
            strokeOpacity={0.85}
          />
          <Circle cx={27} cy={28} r={3.66} fill="#ecfdf5" />
          <Text
            x={58}
            y={38}
            style={{
              fontFamily: PDF_FONT_FAMILY,
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: -1.2,
              fill: '#064e3b',
            }}
          >
            Scopeo
          </Text>
          <Text
            x={58}
            y={50}
            style={{
              fontFamily: PDF_FONT_FAMILY,
              fontSize: 8.5,
              fontWeight: 600,
              letterSpacing: 2.2,
              fill: '#64748b',
            }}
          >
            ESG INTELLIGENCE
          </Text>
        </Svg>
      </View>
      <Text style={styles.confidential}>{rightLabel}</Text>
    </View>
  );
}

export function GhgReportDocument({ data }: { data: GhgReportDocumentData }) {
  const resolvedReportNumber =
    data.reportNumber ??
    `SCOPEO/GHG/${data.reportingYear}/${String(data.generatedAt).replace(/\D/g, '').slice(0, 8) || '0001'}`;
  const resolvedApprovedAt = data.approvedAt ?? data.generatedAt;
  const resolvedResponsiblePerson = data.responsiblePerson ?? '................................................';
  const resolvedClause =
    data.contractualClause ??
    'Niniejszy raport przygotowano na potrzeby odpowiedzi kontrahenckiej i przekazano w dobrej wierze, na podstawie danych dostarczonych przez raportujaca organizacje. Zakres odpowiedzialnosci Scopeo ogranicza sie do przetworzenia danych zgodnie z uzgodniona metodyka.';
  const resolvedSnapshotHash = data.snapshotHashSha256 ?? 'hash-not-embedded';
  const scope2LocationKg = Number(data.scope2LocationKg ?? data.scope2);
  const scope2MarketKg = Number(data.scope2MarketKg ?? data.scope2);
  const scope2DeltaKg = scope2MarketKg - scope2LocationKg;
  const qualityScore = Number(data.dataQuality?.score ?? 100);
  const qualityFlaggedPct = Number(data.dataQuality?.flaggedImpactPct ?? 0);
  const scope3CoveragePct = Number(data.scope3Completeness?.summary?.coveragePct ?? 0);
  const scope3CoveredCount = Number(data.scope3Completeness?.summary?.coveredCount ?? 0);
  const scope3TotalCount = Number(data.scope3Completeness?.summary?.totalCount ?? 0);
  const totalLocationBasedKg = Number(data.totalLocationBasedKg ?? data.totalKg);
  const totalMarketBasedKg = Number(data.totalMarketBasedKg ?? data.totalKg);
  const reportTotalDisplayBasis = data.reportTotalDisplayBasis ?? 'LB';
  const auditRiskLabel = data.dataQuality?.auditRiskLabel;
  const recalculationDeltaPct = Number(data.latestBaseYearRecalculation?.impactSummary?.deltaPct ?? 0);
  const recalculationDeltaKg = Number(data.latestBaseYearRecalculation?.impactSummary?.deltaKg ?? 0);
  const recalculationMaterial = Boolean(data.latestBaseYearRecalculation?.impactSummary?.materialThresholdExceeded ?? false);
  const tCO2 = (kg: number) => (kg / 1000).toFixed(2);
  const pct = (kg: number) => (data.totalKg > 0 ? `${((kg / data.totalKg) * 100).toFixed(1)}%` : '0%');
  const kgToText = (kg: number) => `${kg.toFixed(0)} kg`;
  const topScope = [
    { label: 'Scope 1', value: data.scope1 },
    { label: 'Scope 2', value: data.scope2 },
    { label: 'Scope 3', value: data.scope3 },
  ].sort((a, b) => b.value - a.value)[0];

  const sortedCategories = Object.entries(data.byCategory)
    .sort(([, a], [, b]) => b - a)
    .filter(([, v]) => v > 0);
  const palette = [
    '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#84cc16', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899',
    '#f97316', '#eab308', '#14b8a6',
  ];
  const topThreeShare = sortedCategories.slice(0, 3).reduce((sum, [, kg]) => sum + kg, 0) / (data.totalKg || 1);
  const categoryEvidenceMap = new Map(
    data.evidenceTrail?.aggregateEvidence?.categories?.map((item) => [item.categoryCode, item.evidenceId]) ?? []
  );
  const pieInput = sortedCategories.slice(0, GHG_REPORT_PIE_TOP_N);
  const restKg = sortedCategories.slice(GHG_REPORT_PIE_TOP_N).reduce((sum, [, kg]) => sum + kg, 0);
  const pieData = restKg > 0 ? [...pieInput, ['Pozostale kategorie', restKg] as [string, number]] : pieInput;
  const tableCategories = sortedCategories.slice(0, GHG_REPORT_TABLE_MAX_ROWS);
  const evidenceEntriesAll = data.evidenceTrail?.entries ?? [];
  /** Przy >=11 rekordach pokazujemy co najmniej 11 pierwszych (wymaganie raportu kontrahenta). */
  const evidenceTake =
    evidenceEntriesAll.length === 0
      ? 0
      : evidenceEntriesAll.length < 11
        ? evidenceEntriesAll.length
        : Math.min(GHG_REPORT_EVIDENCE_MAX_ROWS, evidenceEntriesAll.length);
  const evidenceEntriesLimited = evidenceEntriesAll.slice(0, evidenceTake);
  const scope3MatrixLimited = (data.scope3Completeness?.matrix ?? []).slice(0, GHG_REPORT_SCOPE3_MATRIX_MAX_ROWS);
  let pieAngle = 0;
  const pieSegments = pieData.map(([code, kg], idx) => {
    const share = data.totalKg > 0 ? kg / data.totalKg : 0;
    const sweep = share * 360;
    const start = pieAngle;
    const end = pieAngle + sweep;
    pieAngle = end;
    return {
      code,
      kg,
      share,
      start,
      end,
      color: palette[idx % palette.length],
    };
  });

  const footerLine = (n: 1 | 2 | 3) =>
    `Strona ${n}/3 · Raport wygenerowany przez Scopeo dnia ${data.generatedAt}. ` +
    (n === 1
      ? 'Material operacyjno-zaradczy; nie stanowi certyfikowanej opinii audytorskiej.'
      : 'Dokument ma charakter formalny roboczy i nie stanowi certyfikatu zgodnosci.');

  return (
    <Document>
      {/* wrap=false: domyslne wrap=true na Page rozdziela treść na kolejna stronę PDF — drugi <Page> zaczynał się wtedy „po pustej” stronie. */}
      <Page size="A4" style={styles.page} wrap={false}>
        <ScopeoPdfBrandRow rightLabel="Poufne · tylko do uzytku wewnetrznego" />

        <View style={styles.section}>
          <Text style={styles.title}>Raport Emisji GHG (ESG)</Text>
          <Text style={styles.subtitle}>
            {data.companyName} | Rok raportowania: {data.reportingYear} | Rok bazowy: {data.baseYear}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Executive Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.cardLabel}>Laczna emisja</Text>
              <Text style={styles.cardValue}>
                {tCO2(data.totalKg)} tCO2e [{data.evidenceTrail?.aggregateEvidence?.total?.evidenceId ?? 'EV-TOTAL'}]
              </Text>
              <Text style={styles.cardSub}>{kgToText(data.totalKg)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.cardLabel}>Dominujacy zakres</Text>
              <Text style={styles.cardValue}>{topScope?.label ?? 'n/d'}</Text>
              <Text style={styles.cardSub}>{topScope ? pct(topScope.value) : '0%'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.cardLabel}>Scope 1 + 2 + 3</Text>
              <Text style={styles.cardValue}>
                {tCO2(data.scope1)} [{data.evidenceTrail?.aggregateEvidence?.scope1?.evidenceId ?? 'EV-SCOPE1'}] / {tCO2(scope2LocationKg)} [{data.evidenceTrail?.aggregateEvidence?.scope2LocationBased?.evidenceId ?? data.evidenceTrail?.aggregateEvidence?.scope2?.evidenceId ?? 'EV-SCOPE2-LB'}] / {tCO2(data.scope3)} [{data.evidenceTrail?.aggregateEvidence?.scope3?.evidenceId ?? 'EV-SCOPE3'}]
              </Text>
              <Text style={styles.cardSub}>tCO2e</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.cardLabel}>Koncentracja top 3 kategorii</Text>
              <Text style={styles.cardValue}>{(topThreeShare * 100).toFixed(1)}%</Text>
              <Text style={styles.cardSub}>udzialu w emisji calkowitej</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.cardLabel}>Scope 2 LB / MB</Text>
              <Text style={styles.cardValue}>{tCO2(scope2LocationKg)} / {tCO2(scope2MarketKg)}</Text>
              <Text style={styles.cardSub}>
                tCO2e | Delta MB-LB: {(scope2DeltaKg / 1000).toFixed(2)} t
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.cardLabel}>Data Quality Score</Text>
              <Text style={styles.cardValue}>{qualityScore.toFixed(1)} / 100</Text>
              <Text style={styles.cardSub}>Flagged impact: {qualityFlaggedPct.toFixed(1)}% emisji</Text>
              {auditRiskLabel ? (
                <Text style={[styles.cardSub, { marginTop: 4, color: '#b45309' }]}>Automatyczna flaga: {auditRiskLabel}</Text>
              ) : null}
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.cardLabel}>Scope 3 Completeness</Text>
              <Text style={styles.cardValue}>
                {scope3CoveragePct.toFixed(1)}%
              </Text>
              <Text style={styles.cardSub}>
                Covered: {scope3CoveredCount}/{scope3TotalCount} kategorii Scope 3
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Boundary and Reporting Statement</Text>
          <View style={styles.narrativeBox}>
            <Text style={styles.narrativeText}>
              Raport przygotowano zgodnie z podejsciem Corporate Accounting and Reporting Standard (GHG Protocol).
              Granica organizacyjna: {formatBoundaryApproachLabel(data.boundaryApproach)}. Zakres obejmuje Scope 1, Scope 2 i Scope 3 na podstawie
              danych operacyjnych i fakturowych dostepnych za okres raportowy {data.reportingYear}. Najwiekszy udzial
              w emisji calkowitej ma {topScope?.label ?? 'dominujacy zakres'} ({topScope ? pct(topScope.value) : '0%'}),
              a koncentracja top 3 kategorii wynosi {(topThreeShare * 100).toFixed(1)}%.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>{footerLine(1)}</Text>
      </Page>

      <Page size="A4" style={styles.page} wrap={false}>
        <ScopeoPdfBrandRow rightLabel="Zalacznik analityczny" />

        <View style={styles.section}>
          <Text style={styles.title}>Szczegolowa Analiza Emisji</Text>
          <Text style={styles.subtitle}>
            {data.companyName} | Rok raportowania: {data.reportingYear}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Struktura Emisji wg Kategorii (Wykres Kolowy)</Text>
          <View style={styles.pieWrap}>
            <View style={styles.pieCanvas}>
              <Svg width={180} height={180}>
                <G>
                  {pieSegments.map((segment) => (
                    <Path
                      key={`pie-${segment.code}`}
                      d={describePieArc(90, 90, 78, segment.start, segment.end)}
                      fill={segment.color}
                    />
                  ))}
                  <Circle cx={90} cy={90} r={35} fill="#f8fafc" />
                </G>
              </Svg>
            </View>
            <View style={styles.pieLegend}>
              {pieSegments.map((segment) => (
                <View key={`legend-${segment.code}`} style={styles.pieLegendRow}>
                  <View style={[styles.pieLegendDot, { backgroundColor: segment.color }]} />
                  <Text style={styles.pieLegendLabel}>
                    {segment.code === 'Pozostale kategorie' ? segment.code : categoryLabel(segment.code)}
                  </Text>
                  <Text style={styles.pieLegendValue}>
                    {tCO2(segment.kg)} t ({(segment.share * 100).toFixed(1)}%)
                  </Text>
                </View>
              ))}
              <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>
                Wykres prezentuje {GHG_REPORT_PIE_TOP_N} najwiekszych kategorii oraz agregat pozostalych pozycji (jesli wystepuja).
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Tabela Szczegolowa Kategorii</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.colCategory, { fontWeight: 'bold' }]}>Kategoria</Text>
            <Text style={[styles.colScope, { fontWeight: 'bold' }]}>Zakres</Text>
            <Text style={[styles.colTons, { fontWeight: 'bold' }]}>tCO2e</Text>
            <Text style={[styles.colShare, { fontWeight: 'bold' }]}>Udzial</Text>
          </View>
          {tableCategories.map(([code, kg]) => (
            <View key={`row-${code}`} style={styles.tableRow}>
              <Text style={styles.colCategory}>
                {categoryLabel(code)} [{categoryEvidenceMap.get(code) ?? `EV-CAT-${code}`}]
              </Text>
              <Text style={styles.colScope}>{scopeLabel(code)}</Text>
              <Text style={styles.colTons}>{tCO2(kg)}</Text>
              <Text style={styles.colShare}>{pct(kg)}</Text>
            </View>
          ))}
          {sortedCategories.length > tableCategories.length ? (
            <View style={styles.tableRow}>
              <Text style={styles.colCategory}>
                ... oraz {sortedCategories.length - tableCategories.length} dodatkowych kategorii (pelna lista w CSV/XLSX).
              </Text>
              <Text style={styles.colScope}>-</Text>
              <Text style={styles.colTons}>-</Text>
              <Text style={styles.colShare}>-</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Sekcja Wysylkowa do Kontrahenta</Text>
          <View style={styles.methodologyWrap}>
            <Text style={styles.methodologyLine}>• Numer raportu: {resolvedReportNumber}</Text>
            <Text style={styles.methodologyLine}>• Data zatwierdzenia: {resolvedApprovedAt}</Text>
            <Text style={styles.methodologyLine}>• Osoba odpowiedzialna: {resolvedResponsiblePerson}</Text>
            <Text style={styles.methodologyLine}>• Hash snapshotu (SHA-256): {resolvedSnapshotHash}</Text>
            <Text style={[styles.methodologyLine, { marginTop: 4 }]}>
              • Klauzula umowna: {resolvedClause}
            </Text>
            <Text style={[styles.methodologyLine, { marginTop: 8 }]}>
              • Podpis osoby odpowiedzialnej: ________________________________
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>{footerLine(2)}</Text>
      </Page>

      <Page size="A4" style={styles.page} wrap={true}>
        <ScopeoPdfBrandRow rightLabel="Zalacznik audytowy" />

        <View style={styles.section}>
          <Text style={styles.title}>Audit Annex i Jakosc Danych</Text>
          <Text style={styles.subtitle}>
            {data.companyName} | Rok raportowania: {data.reportingYear}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Formal Report Pack</Text>
          <View style={styles.methodologyWrap}>
            <Text style={styles.methodologyTitle}>Metodyka</Text>
            {(data.formalReportPack?.methodology ?? ['GHG Protocol Corporate Standard.']).map((line, i) => (
              <Text key={`fr-m-${i}`} style={styles.methodologyLine}>
                • {line}
              </Text>
            ))}
            <Text style={[styles.methodologyTitle, { marginTop: 6 }]}>Granice i zakres</Text>
            {(data.formalReportPack?.boundaries ?? [
              `Granica organizacyjna: ${formatBoundaryApproachLabel(data.boundaryApproach)}.`,
            ]).map((line, i) => (
              <Text key={`fr-b-${i}`} style={styles.methodologyLine}>
                • {line}
              </Text>
            ))}
            <Text style={[styles.methodologyTitle, { marginTop: 6 }]}>Wykluczenia i ograniczenia</Text>
            {(data.formalReportPack?.exclusions ?? ['Mozliwe braki danych spoza dostarczonego zakresu.']).map((line, i) => (
              <Text key={`fr-e-${i}`} style={styles.methodologyLine}>
                • {line}
              </Text>
            ))}
            <Text style={[styles.methodologyTitle, { marginTop: 6 }]}>Niepewnosc</Text>
            {(data.formalReportPack?.uncertainty ?? ['Poziom niepewnosci zalezy od jakosci danych zrodlowych.']).map((line, i) => (
              <Text key={`fr-u-${i}`} style={styles.methodologyLine}>
                • {line}
              </Text>
            ))}
            <Text style={[styles.methodologyTitle, { marginTop: 6 }]}>Odpowiedzialnosc</Text>
            {(data.formalReportPack?.responsibility ?? ['Za dane wejsciowe odpowiada raportujaca organizacja.']).map((line, i) => (
              <Text key={`fr-r-${i}`} style={styles.methodologyLine}>
                • {line}
              </Text>
            ))}
            <Text style={[styles.methodologyTitle, { marginTop: 6 }]}>Assurance</Text>
            {(data.formalReportPack?.assuranceStatus ?? ['External assurance: not performed.']).map((line, i) => (
              <Text key={`fr-a-${i}`} style={styles.methodologyLine}>
                • {line}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Evidence Trail (Audit Annex)</Text>
          <View style={styles.methodologyWrap}>
            <Text style={styles.methodologyLine}>
              • EV-TOTAL, EV-SCOPE1/2/3 oraz EV-CAT-* mapuja kazda liczbe raportowa do zestawu dowodow linii zrodlowych.
            </Text>
            <Text style={styles.methodologyLine}>
              • Linki zrodlowe prowadza do rekordow faktur KSeF i faktorow/metodyk w aplikacji.
            </Text>
            <Text style={styles.methodologyLine}>
              • Ponizej lista linii dowodowych (skrot): EvidenceID | Faktura | Linia | Faktor | Metodyka | Link.
            </Text>
            {evidenceEntriesLimited.map((entry) => (
              <Text key={entry.evidenceId} style={styles.methodologyLine}>
                • {entry.evidenceId} | {entry.invoiceNumber} | {entry.lineId.slice(0, 8)} | {entry.factorCode ?? 'BRAK'} | {entry.methodologyVersion}
              </Text>
            ))}
            {data.evidenceTrail && data.evidenceTrail.entries.length > evidenceEntriesLimited.length ? (
              <Text style={styles.methodologyLine}>
                • ... oraz {data.evidenceTrail.entries.length - evidenceEntriesLimited.length} kolejnych rekordow dowodowych (pelny wykaz w eksporcie CSV/XLSX/JSON).
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Data Quality Scoring</Text>
          <View style={styles.methodologyWrap}>
            <Text style={styles.methodologyLine}>
              • Score: {qualityScore.toFixed(2)} / 100 (im wyzej, tym mniejszy wplyw danych oznaczonych flagami jakosci).
            </Text>
            <Text style={styles.methodologyLine}>
              • Flagged impact: {(data.dataQuality?.flaggedImpactKg ?? 0).toFixed(2)} kg ({qualityFlaggedPct.toFixed(2)}% calkowitej emisji).
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Scope 3 Completeness Matrix</Text>
          <View style={styles.methodologyWrap}>
            <Text style={styles.methodologyLine}>
              • Pokrycie macierzy Scope 3: {scope3CoveragePct.toFixed(2)}% ({scope3CoveredCount}/{scope3TotalCount} kategorii).
            </Text>
            {scope3MatrixLimited.map((item) => (
              <Text key={item.categoryCode} style={styles.methodologyLine}>
                • {item.categoryLabel} [{item.categoryCode}] → {item.status === 'covered' ? 'covered' : 'not covered'}
              </Text>
            ))}
            {(data.scope3Completeness?.matrix ?? []).length > scope3MatrixLimited.length ? (
              <Text style={styles.methodologyLine}>
                • ... oraz {(data.scope3Completeness?.matrix ?? []).length - scope3MatrixLimited.length} kolejnych pozycji macierzy Scope 3 (pelny eksport w CSV/XLSX/JSON).
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Base Year Recalculation Log</Text>
          <View style={styles.methodologyWrap}>
            <Text style={styles.methodologyLine}>
              • Polityka formalna: {data.baseYearRecalculationPolicy?.standard ?? 'GHG Protocol Corporate Standard'} v{data.baseYearRecalculationPolicy?.version ?? '1.0'}.
            </Text>
            <Text style={styles.methodologyLine}>
              • Zasada istotnosci: {data.baseYearRecalculationPolicy?.materialityRule ?? 'Przeliczenie wymagane przy istotnym wplywie na rok bazowy.'}
            </Text>
            {data.latestBaseYearRecalculation ? (
              <>
                <Text style={[styles.methodologyLine, { marginTop: 4 }]}>
                  • Ostatnia rekalkulacja: {data.latestBaseYearRecalculation.previousBaseYear} → {data.latestBaseYearRecalculation.newBaseYear} ({data.latestBaseYearRecalculation.triggerType}), zatwierdzono: {data.latestBaseYearRecalculation.approvedAt}, autor: {data.latestBaseYearRecalculation.author}.
                </Text>
                <Text style={styles.methodologyLine}>
                  • Wplyw na baseline: {recalculationDeltaKg.toFixed(2)} kg ({recalculationDeltaPct.toFixed(2)}%), materialnosc (prog 5%): {recalculationMaterial ? 'TAK' : 'NIE'}.
                </Text>
              </>
            ) : (
              <Text style={[styles.methodologyLine, { marginTop: 4 }]}>
                • Rejestr rekalkulacji: brak zarejestrowanych zmian roku bazowego dla tej organizacji.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Lista kontrolna kompletnosci (11 punktow)</Text>
          <View style={styles.methodologyWrap}>
            {GHG_REPORT_CHECKLIST_11.map((line, idx) => (
              <Text key={`chk-${idx}`} style={styles.methodologyLine}>
                {idx + 1}. {line}
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>{footerLine(3)}</Text>
      </Page>
    </Document>
  );
}
