/**
 * Ten sam raport PDF co eksport z Scopeo (GhgReportDocument + buildGhgReportDocumentData
 * jak GET /api/emissions/report), na przykladowych danych bez bazy — plik na Pulpit.
 * Uzycie: DISABLE_REMOTE_PDF_FONTS=1 node --import tsx scripts/render-ghg-report-preview.tsx
 */
import { renderToBuffer } from '@react-pdf/renderer';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import React from 'react';
import { buildGhgReportDocumentData, type GhgReportComputedInput } from '@/lib/ghg-report-document-data';
import { GhgReportDocument } from '@/lib/ghg-report-pdf';

type Row = { code: string; kg: number; scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3' };

const PREVIEW_ROWS: Row[] = [
  { code: 'scope1_fuel', kg: 420, scope: 'SCOPE1' },
  { code: 'scope1_fuel_gas', kg: 80, scope: 'SCOPE1' },
  { code: 'scope2_electricity', kg: 6200, scope: 'SCOPE2' },
  { code: 'scope2_district_heat', kg: 800, scope: 'SCOPE2' },
  { code: 'scope3_cat1_purchased_goods', kg: 1100, scope: 'SCOPE3' },
  { code: 'scope3_cat1_purchased_services', kg: 820, scope: 'SCOPE3' },
  { code: 'scope3_cat2_capital_goods', kg: 360, scope: 'SCOPE3' },
  { code: 'scope3_cat4_transport', kg: 550, scope: 'SCOPE3' },
  { code: 'scope3_cat5_waste', kg: 140, scope: 'SCOPE3' },
  { code: 'scope3_cat6_business_travel', kg: 290, scope: 'SCOPE3' },
  { code: 'scope3_cat3_fuel_energy', kg: 400, scope: 'SCOPE3' },
];

function sumScope(scope: Row['scope']) {
  return PREVIEW_ROWS.filter((r) => r.scope === scope).reduce((s, r) => s + r.kg, 0);
}

function buildComputed(reportYear: number): GhgReportComputedInput {
  const byCategory = Object.fromEntries(PREVIEW_ROWS.map((r) => [r.code, r.kg]));
  const scope1 = sumScope('SCOPE1');
  const scope2 = sumScope('SCOPE2');
  const scope3 = sumScope('SCOPE3');
  const totalKg = scope1 + scope2 + scope3;
  const scope2LocationKg = scope2;
  const scope2MarketKg = scope2;

  const lineIds = PREVIEW_ROWS.map((_, i) => `line-preview-${i + 1}`);
  const evidenceIds = PREVIEW_ROWS.map((_, i) => `EV-LINE-preview-${i + 1}`);
  const invoiceIds = PREVIEW_ROWS.map((_, i) => `inv-preview-${i + 1}`);

  const entries = PREVIEW_ROWS.map((row, i) => ({
    evidenceId: evidenceIds[i],
    co2eKg: row.kg,
    scope: row.scope,
    categoryCode: row.code,
    calculationMethod: 'ACTIVITY' as const,
    invoiceId: invoiceIds[i],
    invoiceNumber: `FV/PREVIEW/${i + 1}`,
    invoiceExternalId: `EXT-${i + 1}`,
    invoiceIssueDate: `${reportYear}-03-${String((i % 27) + 1).padStart(2, '0')}T00:00:00.000Z`,
    invoiceSourceLink: `https://app.scopeo.com/dashboard/invoices?invoiceId=${invoiceIds[i]}`,
    lineId: lineIds[i],
    lineDescription: `Pozycja demonstracyjna ${i + 1} (${row.code})`,
    factorId: `factor-preview-${i + 1}`,
    factorCode: `FACTOR_${i + 1}`,
    factorValue: 0.5 + i * 0.01,
    factorUnit: 'kgCO2e/jednostka',
    methodologyVersion: 'DEMO_SRC@1.0',
    emissionSourceCode: 'DEMO_SRC',
    emissionSourceVersion: '1.0',
    factorSourceLink: `https://app.scopeo.com/dashboard/factors?factorId=factor-preview-${i + 1}`,
  }));

  const scopeEvidenceIds = {
    SCOPE1: evidenceIds.filter((_, i) => PREVIEW_ROWS[i].scope === 'SCOPE1'),
    SCOPE2: evidenceIds.filter((_, i) => PREVIEW_ROWS[i].scope === 'SCOPE2'),
    SCOPE3: evidenceIds.filter((_, i) => PREVIEW_ROWS[i].scope === 'SCOPE3'),
  };

  const categories = PREVIEW_ROWS.map((row, i) => ({
    categoryCode: row.code,
    evidenceId: `EV-CAT-${row.code}`,
    valueKg: row.kg,
    sourceEvidenceIds: [evidenceIds[i]],
  }));

  return {
    scope1,
    scope2,
    scope3,
    totalKg,
    scope2LocationKg,
    scope2MarketKg,
    byCategory,
    lineCount: PREVIEW_ROWS.length,
    dataQuality: {
      score: 100,
      flaggedImpactKg: 0,
      flaggedImpactPct: 0,
      impactByFlagKg: { estimated: 0, missing: 0, assumed: 0 },
      impactByFlagPct: { estimated: 0, missing: 0, assumed: 0 },
      lineCountsByFlag: { estimated: 0, missing: 0, assumed: 0 },
    },
    scope3Completeness: {
      summary: { coveredCount: 7, totalCount: 15, coveragePct: (7 / 15) * 100 },
      matrix: PREVIEW_ROWS.filter((r) => r.scope === 'SCOPE3').map((r) => ({
        categoryCode: r.code,
        categoryLabel: r.code.replace(/_/g, ' '),
        status: 'covered' as const,
        coveredKg: r.kg,
        matchedCategories: [r.code],
        reason: 'Dane demonstracyjne w podgladzie PDF.',
      })),
    },
    evidenceTrail: {
      aggregateEvidence: {
        total: { evidenceId: 'EV-TOTAL', valueKg: totalKg, sourceEvidenceIds: evidenceIds },
        scope1: { evidenceId: 'EV-SCOPE1', valueKg: scope1, sourceEvidenceIds: scopeEvidenceIds.SCOPE1 },
        scope2: { evidenceId: 'EV-SCOPE2', valueKg: scope2, sourceEvidenceIds: scopeEvidenceIds.SCOPE2 },
        scope2LocationBased: {
          evidenceId: 'EV-SCOPE2-LB',
          valueKg: scope2LocationKg,
          sourceEvidenceIds: scopeEvidenceIds.SCOPE2,
        },
        scope2MarketBased: {
          evidenceId: 'EV-SCOPE2-MB',
          valueKg: scope2MarketKg,
          sourceEvidenceIds: scopeEvidenceIds.SCOPE2,
        },
        scope3: { evidenceId: 'EV-SCOPE3', valueKg: scope3, sourceEvidenceIds: scopeEvidenceIds.SCOPE3 },
        categories,
      },
      entries,
    },
  };
}

async function main() {
  const reportYear = 2026;
  const computed = buildComputed(reportYear);

  const reportData = buildGhgReportDocumentData({
    profile: {
      companyName: 'Organizacja demonstracyjna (export jak w aplikacji Scopeo)',
      baseYear: reportYear - 1,
      boundaryApproach: 'operational_control',
      industry: 'Uslugi profesjonalne',
    },
    reportingYear: reportYear,
    computed,
    snapshot: null,
    latestBaseYearRecalculation: null,
    generatedAt: new Date().toLocaleDateString('pl-PL'),
  });

  const pdf = Buffer.from(await renderToBuffer(<GhgReportDocument data={reportData} />));

  const reportsDir = path.join(process.cwd(), 'reports');
  await fs.mkdir(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const repoPath = path.join(reportsDir, `raport-esg-preview-${stamp}.pdf`);
  await fs.writeFile(repoPath, pdf);

  const desktopPath = path.join(os.homedir(), 'Desktop', 'Raport-Scopeo-GHG.pdf');
  await fs.writeFile(desktopPath, pdf);

  console.log(`REPORT_REPO=${repoPath}`);
  console.log(`REPORT_DESKTOP=${desktopPath}`);
  console.log(`CATEGORIES=${Object.keys(computed.byCategory).length} EVIDENCE_LINES=${computed.evidenceTrail?.entries.length ?? 0}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
