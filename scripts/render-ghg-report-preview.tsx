/**
 * Generuje PDF raportu GHG bez bazy (przykładowe dane spójne z kalkulatorem).
 * Użycie: DISABLE_REMOTE_PDF_FONTS=1 node --import tsx scripts/render-ghg-report-preview.tsx
 */
import { renderToBuffer } from '@react-pdf/renderer';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import React from 'react';
import { buildGhgReportDocumentData, normalizeGhgReportPdfToMaxPages, type GhgReportComputedInput } from '@/lib/ghg-report-document-data';
import { GhgReportDocument } from '@/lib/ghg-report-pdf';

async function main() {
  const reportYear = 2026;
  const scope2LocationKg = 12000 * 0.7309;
  const scope2MarketKg = scope2LocationKg;
  const scope1 = 0;
  const scope3 = 0;
  const totalKg = scope1 + scope2LocationKg + scope3;
  const lineEvidenceId = 'EV-LINE-preview-1';

  const computed: GhgReportComputedInput = {
    scope1,
    scope2: scope2LocationKg,
    scope3,
    totalKg,
    scope2LocationKg,
    scope2MarketKg,
    byCategory: { scope2_electricity: scope2LocationKg },
    lineCount: 1,
    dataQuality: {
      score: 100,
      flaggedImpactKg: 0,
      flaggedImpactPct: 0,
      impactByFlagKg: { estimated: 0, missing: 0, assumed: 0 },
      impactByFlagPct: { estimated: 0, missing: 0, assumed: 0 },
      lineCountsByFlag: { estimated: 0, missing: 0, assumed: 0 },
    },
    scope3Completeness: {
      summary: { coveredCount: 0, totalCount: 15, coveragePct: 0 },
      matrix: [
        {
          categoryCode: 'scope3_cat1_purchased_goods',
          categoryLabel: 'Kat. 1: Kupione materialy',
          status: 'not_covered',
          coveredKg: 0,
          matchedCategories: [],
          reason: 'Brak danych w okresie raportowym.',
        },
      ],
    },
    evidenceTrail: {
      aggregateEvidence: {
        total: { evidenceId: 'EV-TOTAL', valueKg: totalKg, sourceEvidenceIds: [lineEvidenceId] },
        scope1: { evidenceId: 'EV-SCOPE1', valueKg: scope1, sourceEvidenceIds: [] },
        scope2: { evidenceId: 'EV-SCOPE2', valueKg: scope2LocationKg, sourceEvidenceIds: [lineEvidenceId] },
        scope2LocationBased: {
          evidenceId: 'EV-SCOPE2-LB',
          valueKg: scope2LocationKg,
          sourceEvidenceIds: [lineEvidenceId],
        },
        scope2MarketBased: {
          evidenceId: 'EV-SCOPE2-MB',
          valueKg: scope2MarketKg,
          sourceEvidenceIds: [lineEvidenceId],
        },
        scope3: { evidenceId: 'EV-SCOPE3', valueKg: scope3, sourceEvidenceIds: [] },
        categories: [
          {
            categoryCode: 'scope2_electricity',
            evidenceId: 'EV-CAT-scope2_electricity',
            valueKg: scope2LocationKg,
            sourceEvidenceIds: [lineEvidenceId],
          },
        ],
      },
      entries: [
        {
          evidenceId: lineEvidenceId,
          co2eKg: scope2LocationKg,
          scope: 'SCOPE2',
          categoryCode: 'scope2_electricity',
          calculationMethod: 'ACTIVITY',
          invoiceId: 'inv-preview-1',
          invoiceNumber: 'FV/PREVIEW/1',
          invoiceExternalId: 'EXT-1',
          invoiceIssueDate: `${reportYear}-03-15T00:00:00.000Z`,
          invoiceSourceLink: 'https://app.scopeo.com/dashboard/invoices?invoiceId=inv-preview-1',
          lineId: 'line-preview-1',
          lineDescription: 'Zuzycie energii elektrycznej biuro',
          factorId: 'factor-preview-1',
          factorCode: 'TEST_FACTOR',
          factorValue: 0.7309,
          factorUnit: 'kgCO2e/kWh',
          methodologyVersion: 'TEST_SRC@1.0',
          emissionSourceCode: 'TEST_SRC',
          emissionSourceVersion: '1.0',
          factorSourceLink: 'https://app.scopeo.com/dashboard/factors?factorId=factor-preview-1',
        },
      ],
    },
  };

  const reportData = buildGhgReportDocumentData({
    profile: {
      companyName: 'Firma demonstracyjna Scopeo (preview PDF)',
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

  const raw = await renderToBuffer(<GhgReportDocument data={reportData} />);
  const pdf = await normalizeGhgReportPdfToMaxPages(Buffer.from(raw), 3);

  const reportsDir = path.join(process.cwd(), 'reports');
  await fs.mkdir(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const repoPath = path.join(reportsDir, `raport-esg-preview-${stamp}.pdf`);
  await fs.writeFile(repoPath, pdf);

  const desktopPath = path.join(os.homedir(), 'Desktop', 'raport-esg-ostatni.pdf');
  await fs.writeFile(desktopPath, pdf);

  console.log(`REPORT_REPO=${repoPath}`);
  console.log(`REPORT_DESKTOP=${desktopPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
