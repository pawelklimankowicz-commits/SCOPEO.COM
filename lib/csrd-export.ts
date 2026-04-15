import { prisma } from '@/lib/prisma';

export interface CsrdReportData {
  organizationId: string;
  reportYear: number;
  generatedAt: string;
  organizationName: string;
  taxId: string | null;
  scope1Total: number;
  scope2Total: number;
  scope3Total: number;
  totalGhg: number;
  byCategory: CsrdCategory[];
  methodology: string;
  dataQuality: 'ESTIMATED' | 'CALCULATED' | 'MEASURED';
  boundaryApproach: 'OPERATIONAL_CONTROL';
}

export interface CsrdCategory {
  scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
  category: string;
  categoryLabel: string;
  totalTCO2e: number;
  lineCount: number;
  factorSource: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  scope1_fuel: 'Spalanie paliw',
  scope1_fuel_gas: 'Spalanie paliw - gaz ziemny',
  scope2_electricity: 'Zakup energii elektrycznej',
  scope2_district_heat: 'Zakup ciepla sieciowego',
  scope3_cat1_purchased_services: 'Kat. 1: Zakupione dobra i uslugi',
  scope3_cat2_capital_goods: 'Kat. 2: Dobra kapitalowe',
  scope3_cat4_transport: 'Kat. 4: Transport i dystrybucja',
  scope3_cat5_waste: 'Kat. 5: Odpady',
  scope3_cat6_business_travel: 'Kat. 6: Podroze sluzbowe',
};

function categoryLabel(code: string) {
  return CATEGORY_LABELS[code] ?? code;
}

function factorSourceLabel(code: string | null | undefined, year: number | null | undefined) {
  if (!code) return 'Unknown source';
  const upper = code.toUpperCase();
  if (upper.includes('KOBIZE')) return `KOBiZE ${year ?? ''}`.trim();
  if (upper.includes('UK')) return `UK DESNZ ${year ?? ''}`.trim();
  if (upper.includes('EPA')) return `EPA ${year ?? ''}`.trim();
  return `${code}${year ? ` ${year}` : ''}`;
}

export async function generateCsrdReport(organizationId: string, year: number): Promise<CsrdReportData> {
  const from = new Date(`${year}-01-01T00:00:00.000Z`);
  const to = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const [profile, lines] = await Promise.all([
    prisma.carbonProfile.findUnique({
      where: { organizationId },
      select: { companyName: true, taxId: true },
    }),
    prisma.invoiceLine.findMany({
      where: {
        invoice: {
          organizationId,
          issueDate: { gte: from, lt: to },
        },
      },
      include: {
        invoice: true,
        emissionFactor: { include: { emissionSource: true } },
      },
    }),
  ]);

  const categoryMap = new Map<
    string,
    { scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3'; category: string; totalTCO2e: number; lineCount: number; factorSource: string }
  >();
  let scope1Total = 0;
  let scope2Total = 0;
  let scope3Total = 0;
  let allCalculated = lines.length > 0;

  for (const line of lines) {
    const category = line.overrideCategoryCode ?? line.categoryCode;
    const factor = line.emissionFactor;
    const factorValue = factor?.factorValue ?? 0;
    const co2eKg =
      line.calculationMethod === 'ACTIVITY'
        ? (line.activityValue ?? 0) * factorValue
        : line.netValue * factorValue;
    const totalTCO2e = co2eKg / 1000;
    const scope = line.scope as 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
    const key = `${scope}:${category}`;
    const existing = categoryMap.get(key);
    const factorSource = factorSourceLabel(factor?.emissionSource?.code, factor?.year);
    if (existing) {
      existing.totalTCO2e += totalTCO2e;
      existing.lineCount += 1;
    } else {
      categoryMap.set(key, { scope, category, totalTCO2e, lineCount: 1, factorSource });
    }
    if (!line.emissionFactorId && !line.overrideFactorId) allCalculated = false;
    if (scope === 'SCOPE1') scope1Total += totalTCO2e;
    if (scope === 'SCOPE2') scope2Total += totalTCO2e;
    if (scope === 'SCOPE3') scope3Total += totalTCO2e;
  }

  const byCategory: CsrdCategory[] = Array.from(categoryMap.values())
    .map((row) => ({
      scope: row.scope,
      category: row.category,
      categoryLabel: categoryLabel(row.category),
      totalTCO2e: Number(row.totalTCO2e.toFixed(3)),
      lineCount: row.lineCount,
      factorSource: row.factorSource,
    }))
    .sort((a, b) => b.totalTCO2e - a.totalTCO2e);

  const totalGhg = scope1Total + scope2Total + scope3Total;
  return {
    organizationId,
    reportYear: year,
    generatedAt: new Date().toISOString(),
    organizationName: profile?.companyName ?? 'Organization',
    taxId: profile?.taxId ?? null,
    scope1Total: Number(scope1Total.toFixed(3)),
    scope2Total: Number(scope2Total.toFixed(3)),
    scope3Total: Number(scope3Total.toFixed(3)),
    totalGhg: Number(totalGhg.toFixed(3)),
    byCategory,
    methodology: 'GHG Protocol Corporate Standard',
    dataQuality: allCalculated ? 'CALCULATED' : 'ESTIMATED',
    boundaryApproach: 'OPERATIONAL_CONTROL',
  };
}

export function toCsrdCsv(report: CsrdReportData): string {
  const rows = [
    ['GHG disclosure', 'Value', 'Unit', 'Year', 'Scope', 'Category', 'Methodology'],
    ['Gross Scope 1 GHG emissions', report.scope1Total, 'tCO2e', report.reportYear, 'Scope 1', 'All', 'GHG Protocol'],
    [
      'Gross Scope 2 GHG emissions (location-based)',
      report.scope2Total,
      'tCO2e',
      report.reportYear,
      'Scope 2',
      'All',
      'GHG Protocol',
    ],
    ['Gross Scope 3 GHG emissions', report.scope3Total, 'tCO2e', report.reportYear, 'Scope 3', 'All', 'GHG Protocol'],
    ['Total GHG emissions', report.totalGhg, 'tCO2e', report.reportYear, 'All', 'All', 'GHG Protocol'],
    ...report.byCategory.map((category) => [
      category.categoryLabel,
      category.totalTCO2e,
      'tCO2e',
      report.reportYear,
      category.scope,
      category.category,
      'GHG Protocol',
    ]),
  ];
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? '');
          if (text.includes('"') || text.includes(',') || text.includes('\n')) return `"${text.replace(/"/g, '""')}"`;
          return text;
        })
        .join(',')
    )
    .join('\n');
}

export function toEsrsXml(report: CsrdReportData): string {
  const safe = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<esrs:Report xmlns:esrs="https://xbrl.efrag.org/esrs/2024"
             contextRef="FY${report.reportYear}" entityName="${safe(report.organizationName)}" taxId="${safe(report.taxId ?? '')}">
  <esrs:E1-6_GrossScope1GHGEmissions decimals="3" unitRef="tCO2e">${report.scope1Total}</esrs:E1-6_GrossScope1GHGEmissions>
  <esrs:E1-6_GrossScope2GHGEmissionsLocationBased decimals="3" unitRef="tCO2e">${report.scope2Total}</esrs:E1-6_GrossScope2GHGEmissionsLocationBased>
  <esrs:E1-6_GrossScope3GHGEmissions decimals="3" unitRef="tCO2e">${report.scope3Total}</esrs:E1-6_GrossScope3GHGEmissions>
  <esrs:E1-6_TotalGHGEmissions decimals="3" unitRef="tCO2e">${report.totalGhg}</esrs:E1-6_TotalGHGEmissions>
  <esrs:methodology>${safe(report.methodology)}</esrs:methodology>
  <esrs:boundaryApproach>Operational Control</esrs:boundaryApproach>
  <esrs:generatedAt>${safe(report.generatedAt)}</esrs:generatedAt>
</esrs:Report>`;
}
