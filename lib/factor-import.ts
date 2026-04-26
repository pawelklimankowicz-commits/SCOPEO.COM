import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';
import type { EmissionFactor, EmissionSource } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { prismaTxWithRlsBypass } from '@/lib/prisma-rls-tx';
import { buildKobizeParsedFactors } from '@/lib/kobize-pl-factors';
import { writeProcessingRecord } from '@/lib/privacy-register';
import { createNotification } from '@/lib/notifications';

/** Domyślne URL-e (UK Gov / EPA zmieniają pliki co roku — ustaw env, patrz README i .env.example). */
const DEFAULT_UK_FLAT_XLSX_URL =
  'https://assets.publishing.service.gov.uk/media/6846b6ea57f3515d9611f0dd/ghg-conversion-factors-2025-flat-format.xlsx';
const DEFAULT_EPA_HUB_XLSX_URL =
  'https://www.epa.gov/system/files/other-files/2025-01/ghg-emission-factors-hub-2025.xlsx';

export type FactorImportResolvedConfig = {
  ukDataYear: number;
  epaDataYear: number;
  overlayYear: number;
  ukGhgColumn: string;
  ukFlatXlsxUrl: string;
  epaHubXlsxUrl: string;
};

/**
 * UK Gov i EPA publikują co roku nowe XLSX i zmieniają nagłówki kolumn (np. „GHG Conversion Factor YYYY”).
 * Ustaw zmienne FACTOR_IMPORT_* w środowisku po każdej aktualizacji źródeł (zwykle raz do roku).
 */
export function resolveFactorImportConfig(): FactorImportResolvedConfig {
  const overlayYear = Number(process.env.FACTOR_IMPORT_DATA_YEAR || '2025');
  const ukDataYear = Number(process.env.FACTOR_IMPORT_UK_DATA_YEAR || String(overlayYear));
  const epaDataYear = Number(process.env.FACTOR_IMPORT_EPA_DATA_YEAR || String(overlayYear));
  const ukGhgColumn =
    process.env.FACTOR_IMPORT_UK_GHG_COLUMN?.trim() || `GHG Conversion Factor ${ukDataYear}`;
  const ukFlatXlsxUrl = process.env.FACTOR_IMPORT_UK_FLAT_XLSX_URL?.trim() || DEFAULT_UK_FLAT_XLSX_URL;
  const epaHubXlsxUrl = process.env.FACTOR_IMPORT_EPA_HUB_XLSX_URL?.trim() || DEFAULT_EPA_HUB_XLSX_URL;
  return {
    ukDataYear,
    epaDataYear,
    overlayYear,
    ukGhgColumn,
    ukFlatXlsxUrl,
    epaHubXlsxUrl,
  };
}

export type EmissionFactorWithSource = EmissionFactor & { emissionSource: EmissionSource };

function pickBestEmissionFactorForRegion(
  factors: EmissionFactorWithSource[],
  regionCode: string
): EmissionFactorWithSource | null {
  return (
    factors.find((f) => f.region === regionCode) ||
    factors.find((f) => f.region === 'EU') ||
    factors[0] ||
    null
  );
}

type ValidationIssue = { severity: 'error' | 'warning'; code: string; message: string; context?: string };
type ParsedFactor = { code: string; name: string; scope: 'SCOPE1'|'SCOPE2'|'SCOPE3'; categoryCode: string; factorValue: number; factorUnit: string; region: string; regionPriority: number; activityKind?: string; year: number; tags?: string; metadataJson?: any };

function normalizeText(v: any) { return String(v ?? '').trim(); }
function toNum(v: any) { const s = String(v ?? '').trim().replace(',', '.'); const n = Number(s); return Number.isFinite(n) ? n : null; }
function compact(arr: any[]) { return arr.filter(Boolean); }
function slug(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }

export function validateWorkbookBasics(sheetNames: string[], expectedSheets: string[]) {
  const issues: ValidationIssue[] = [];
  if (!sheetNames.length) issues.push({ severity:'error', code:'NO_SHEETS', message:'Workbook has no sheets' });
  for (const s of expectedSheets) if (!sheetNames.includes(s)) issues.push({ severity:'error', code:'MISSING_SHEET', message:`Missing sheet: ${s}` });
  return issues;
}

function worksheetToRows(worksheet: ExcelJS.Worksheet): any[][] {
  const rows: any[][] = [];
  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const values = row.values as any[];
    const normalized = values.slice(1).map((cell) => {
      if (cell == null) return '';
      if (typeof cell === 'object' && 'text' in cell) return String((cell as any).text ?? '');
      return String(cell);
    });
    rows[rowNumber - 1] = normalized;
  });
  return rows;
}

export function findHeaderRow(rows: any[][], required: string[]) {
  for (let i=0;i<Math.min(rows.length,80);i++) {
    const row = rows[i].map(normalizeText);
    if (required.every(col => row.includes(col))) return i;
  }
  return -1;
}

function validateRequiredColumns(actual: string[], required: string[]) {
  const issues: ValidationIssue[] = [];
  for (const col of required) if (!actual.includes(col)) issues.push({ severity:'error', code:'MISSING_COLUMN', message:`Missing column ${col}` });
  return issues;
}

function mapUkScope(scope: string): 'SCOPE1'|'SCOPE2'|'SCOPE3' {
  const s = scope.toLowerCase();
  if (s.includes('scope 1')) return 'SCOPE1';
  if (s.includes('scope 2')) return 'SCOPE2';
  return 'SCOPE3';
}

function ukCategoryCode(r: any) {
  const path = [r['Level 1'], r['Level 2'], r['Level 3'], r['Level 4'], r['Column Text']].map(normalizeText).filter(Boolean).join(' ');
  const p = path.toLowerCase();
  if (p.includes('diesel') || p.includes('natural gas')) return 'scope1_fuel';
  if (p.includes('electricity')) return 'scope2_electricity';
  if (p.includes('heat') || p.includes('steam')) return 'scope2_district_heat';
  if (p.includes('business travel') || p.includes('hotel') || p.includes('air travel') || p.includes('rail')) return 'scope3_cat6_business_travel';
  if (p.includes('waste')) return 'scope3_cat5_waste';
  if (p.includes('freighting') || p.includes('transport')) return 'scope3_cat4_transport';
  if (p.includes('material') || p.includes('paper') || p.includes('plastic') || p.includes('steel')) return 'scope3_cat1_purchased_goods';
  return 'scope3_cat1_purchased_services';
}

export function parseUkRows(rows: any[][], opts: { ghgColumn: string; dataYear: number }) {
  const { ghgColumn, dataYear } = opts;
  const required = [
    'ID',
    'Scope',
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Column Text',
    'UOM',
    'GHG/Unit',
    ghgColumn,
  ];
  const issues: ValidationIssue[] = [];
  const headerRowIdx = findHeaderRow(rows, required);
  if (headerRowIdx < 0) return { issues:[{ severity:'error', code:'HEADER_NOT_FOUND', message:'Could not locate UK flat file header row' }], factors: [] as ParsedFactor[] };
  const headers = rows[headerRowIdx].map(normalizeText);
  issues.push(...validateRequiredColumns(headers, required));
  if (issues.some(i => i.severity==='error')) return { issues, factors: [] as ParsedFactor[] };
  const jsonRows = rows.slice(headerRowIdx+1).map(r => Object.fromEntries(headers.map((h,idx) => [h, r[idx] ?? ''])));
  const factors: ParsedFactor[] = [];
  for (const r of jsonRows) {
    const id = normalizeText(r['ID']);
    const factorValue = toNum(r[ghgColumn]);
    const ghgUnit = normalizeText(r['GHG/Unit']);
    const uom = normalizeText(r['UOM']);
    if (!id) continue;
    if (factorValue === null) { issues.push({ severity:'warning', code:'EMPTY_FACTOR_VALUE', message:'UK row skipped because factor value is empty', context:id }); continue; }
    if (!uom || !ghgUnit) { issues.push({ severity:'warning', code:'MISSING_UNIT', message:'UK row skipped because units are incomplete', context:id }); continue; }
    const scope = mapUkScope(normalizeText(r['Scope']));
    const name = compact([r['Level 1'], r['Level 2'], r['Level 3'], r['Level 4'], r['Column Text']]).map(normalizeText).join(' / ');
    factors.push({ code: `UK_${slug(id)}_${dataYear}`, name, scope, categoryCode: ukCategoryCode(r), factorValue, factorUnit: `${ghgUnit}/${uom}`, region:'UK', regionPriority:50, activityKind: slug(`${r['Column Text'] || r['Level 3'] || ''}_${uom}`), year:dataYear, tags: compact([r['Level 1'], r['Level 2'], r['Level 3'], r['Level 4'], r['Column Text']]).map(normalizeText).join(','), metadataJson: r });
  }
  if (!factors.length) issues.push({ severity:'error', code:'NO_FACTORS_PARSED', message:'UK parser produced zero factors' });
  return { issues, factors };
}

export function parseEpaRows(rows: any[][], dataYear: number) {
  const issues: ValidationIssue[] = [];
  const tableStarts: Record<string, number> = {};
  for (let i=0;i<rows.length;i++) {
    const marker = normalizeText(rows[i][1]);
    if (/^Table\s+\d+$/i.test(marker)) tableStarts[marker] = i;
  }
  const factors: ParsedFactor[] = [];
  const endOfTable = (start:number) => { for (let i=start+1;i<rows.length;i++) { const marker = normalizeText(rows[i][1]); if (/^Table\s+\d+$/i.test(marker)) return i; } return rows.length; };

  const parseTable = (name:string, mapper:(row:any[])=>ParsedFactor[]|null) => {
    if (tableStarts[name] === undefined) { issues.push({ severity:'warning', code:'MISSING_TABLE', message:`EPA table not found: ${name}` }); return; }
    const seg = rows.slice(tableStarts[name]+1, endOfTable(tableStarts[name]));
    for (const r of seg) {
      const parsed = mapper(r);
      if (parsed && parsed.length) factors.push(...parsed);
    }
  };

  parseTable('Table 2', (r) => {
    const fuel = normalizeText(r[2]); const value = toNum(r[3]); const unit = normalizeText(r[4]);
    if (!fuel || fuel === 'Fuel Type' || value === null || !unit) return null;
    return [{ code:`EPA_mobile_${slug(fuel)}_${dataYear}`, name:`EPA Mobile Combustion ${fuel}`, scope:'SCOPE1', categoryCode:'scope1_fuel', factorValue:value, factorUnit:`kg CO2/${unit}`, region:'US', regionPriority:80, activityKind:slug(`${fuel}_${unit}`), year:dataYear, tags:`epa,mobile,${fuel}`, metadataJson: { table:'Table 2', fuel, unit } }];
  });

  parseTable('Table 6', (r) => {
    const acr = normalizeText(r[2]); const name = normalizeText(r[3]); const co2 = toNum(r[4]);
    if (!acr || acr === 'eGRID Subregion Acronym' || !name || co2 === null) return null;
    return [{ code:`EPA_electricity_${slug(acr)}_${dataYear}`, name:`EPA Electricity ${name}`, scope:'SCOPE2', categoryCode:'scope2_electricity', factorValue:co2, factorUnit:'lb CO2/MWh', region:'US', regionPriority:80, activityKind:'electricity_mwh', year:dataYear, tags:`epa,electricity,${acr}`, metadataJson: { table:'Table 6', acr, name } }];
  });

  parseTable('Table 8', (r) => {
    const vehicle = normalizeText(r[2]); const co2 = toNum(r[3]); const unit = normalizeText(r[6]);
    if (!vehicle || vehicle === 'Vehicle Type' || co2 === null || !unit) return null;
    return [{ code:`EPA_transport_${slug(vehicle)}_${slug(unit)}_${dataYear}`, name:`EPA Transport ${vehicle}`, scope:'SCOPE3', categoryCode:'scope3_cat4_transport', factorValue:co2, factorUnit:`kg CO2/${unit}`, region:'US', regionPriority:80, activityKind:slug(`transport_${unit}`), year:dataYear, tags:`epa,transport,${vehicle}`, metadataJson: { table:'Table 8', vehicle, unit } }];
  });

  parseTable('Table 9', (r) => {
    const material = normalizeText(r[2]); const recycled = toNum(r[3]); const landfilled = toNum(r[4]);
    if (!material || material === 'Material') return null;
    const out: ParsedFactor[] = [];
    if (recycled !== null) out.push({ code:`EPA_waste_${slug(material)}_recycled_${dataYear}`, name:`EPA Waste ${material} recycled`, scope:'SCOPE3', categoryCode:'scope3_cat5_waste', factorValue:recycled, factorUnit:'metric tons CO2e/short ton', region:'US', regionPriority:80, activityKind:'waste_recycled', year:dataYear, tags:`epa,waste,${material}`, metadataJson: { table:'Table 9', mode:'recycled', material } });
    if (landfilled !== null) out.push({ code:`EPA_waste_${slug(material)}_landfilled_${dataYear}`, name:`EPA Waste ${material} landfilled`, scope:'SCOPE3', categoryCode:'scope3_cat5_waste', factorValue:landfilled, factorUnit:'metric tons CO2e/short ton', region:'US', regionPriority:80, activityKind:'waste_landfilled', year:dataYear, tags:`epa,waste,${material}`, metadataJson: { table:'Table 9', mode:'landfilled', material } });
    return out.length ? out : null;
  });

  parseTable('Table 10', (r) => {
    const vehicle = normalizeText(r[2]); const co2 = toNum(r[3]); const unit = normalizeText(r[6]);
    if (!vehicle || vehicle === 'Vehicle Type' || co2 === null || !unit) return null;
    return [{ code:`EPA_travel_${slug(vehicle)}_${slug(unit)}_${dataYear}`, name:`EPA Business Travel ${vehicle}`, scope:'SCOPE3', categoryCode:'scope3_cat6_business_travel', factorValue:co2, factorUnit:`kg CO2/${unit}`, region:'US', regionPriority:80, activityKind:slug(`travel_${unit}`), year:dataYear, tags:`epa,travel,${vehicle}`, metadataJson: { table:'Table 10', vehicle, unit } }];
  });

  if (!factors.length) issues.push({ severity:'error', code:'NO_FACTORS_PARSED', message:'EPA parser produced zero factors' });
  return { issues, factors };
}

const FACTOR_IMPORT_FETCH_TIMEOUT_MS = 25_000;

async function fetchFactorWorkbook(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FACTOR_IMPORT_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function upsertSource(organizationId: string, source: any) {
  return prisma.emissionSource.upsert({ where: { organizationId_code_version: { organizationId, code: source.code, version: source.version } }, update: source, create: { organizationId, ...source } });
}
async function persistFactors(organizationId: string, emissionSourceId: string, factors: ParsedFactor[]) {
  if (factors.length === 0) return 0;
  const chunkSize = 300;
  for (let i = 0; i < factors.length; i += chunkSize) {
    const chunk = factors.slice(i, i + chunkSize);
    const values = chunk.map((f) => {
      const metadataJson = JSON.stringify(f.metadataJson ?? null);
      return Prisma.sql`(
        ${organizationId},
        ${emissionSourceId},
        ${f.code},
        ${f.name},
        ${f.scope},
        ${f.categoryCode},
        ${f.factorValue},
        ${f.factorUnit},
        ${f.region},
        ${f.regionPriority},
        ${f.activityKind ?? null},
        ${f.year},
        ${f.tags ?? null},
        CAST(${metadataJson} AS jsonb)
      )`;
    });

    await prismaTxWithRlsBypass((tx) =>
      tx.$executeRaw(Prisma.sql`
      INSERT INTO "EmissionFactor" (
        "organizationId",
        "emissionSourceId",
        "code",
        "name",
        "scope",
        "categoryCode",
        "factorValue",
        "factorUnit",
        "region",
        "regionPriority",
        "activityKind",
        "year",
        "tags",
        "metadataJson"
      )
      VALUES ${Prisma.join(values)}
      ON CONFLICT ("organizationId", "code", "year")
      DO UPDATE SET
        "emissionSourceId" = EXCLUDED."emissionSourceId",
        "name" = EXCLUDED."name",
        "scope" = EXCLUDED."scope",
        "categoryCode" = EXCLUDED."categoryCode",
        "factorValue" = EXCLUDED."factorValue",
        "factorUnit" = EXCLUDED."factorUnit",
        "region" = EXCLUDED."region",
        "regionPriority" = EXCLUDED."regionPriority",
        "activityKind" = EXCLUDED."activityKind",
        "tags" = EXCLUDED."tags",
        "metadataJson" = EXCLUDED."metadataJson"
    `)
    );
  }
  return factors.length;
}

export async function importExternalFactors(organizationId: string, actorUserId?: string | null) {
  const cfg = resolveFactorImportConfig();
  const sources = {
    uk: {
      code:'UK_GOV_CONVERSION',
      name:'UK Government Conversion Factors',
      publisher:'UK Government',
      sourceUrl: cfg.ukFlatXlsxUrl,
      methodology:'Government conversion factors for company reporting',
      version:`${cfg.ukDataYear}-v1`,
      validFromYear: cfg.ukDataYear,
      region:'UK',
      notes:'Parsed from flat file XLSX (URL/kolumna GHG z env — wymaga corocznej aktualizacji)',
    },
    epa: {
      code:'EPA_EF_HUB',
      name:'EPA GHG Emission Factors Hub',
      publisher:'US EPA',
      sourceUrl: cfg.epaHubXlsxUrl,
      methodology:'Organizational default emission factors',
      version: String(cfg.epaDataYear),
      validFromYear: cfg.epaDataYear,
      region:'US',
      notes:'Parsed from workbook XLSX (URL z env — wymaga corocznej aktualizacji)',
    },
    pl: {
      code: 'KOBIZE_PL',
      name: 'KOBiZE — wskaźniki krajowe (PL)',
      publisher: 'Krajowy Ośrodek Bilansowania i Zarządzania Emisjami (KOBiZE)',
      sourceUrl: 'https://www.kobize.pl/pl/fileCategory/id/28/wskazniki-emisyjnosci',
      methodology:
        'Wskaźniki emisyjności z publikacji KOBiZE (m.in. energia elektryczna); plik data/kobize-pl-factors.json — aktualizacja roczna',
      version: `${cfg.overlayYear}-kobize-v1`,
      validFromYear: cfg.overlayYear,
      region: 'PL',
      notes:
        'Domyślnie: prąd 0,597 kgCO2e/kWh (597 kg CO2/MWh u odbiorcy, rok sprawozdawczy 2023). Dopisz kolejne lata z plików PDF/XLSX na kobize.pl.',
    },
  };
  const results = [];
  for (const item of [sources.uk, sources.epa]) {
    const run = await prisma.factorImportRun.create({ data: { organizationId, actorUserId: actorUserId ?? null, sourceCode: item.code, sourceUrl: item.sourceUrl, status: 'STARTED', validationJson: [] as any } });
    try {
      const res = await fetchFactorWorkbook(item.sourceUrl);
      const workbook = new ExcelJS.Workbook();
      const workbookBytes = Buffer.from(await res.arrayBuffer());
      await workbook.xlsx.load(workbookBytes as any);
      const sheetNames = workbook.worksheets.map((sheet) => sheet.name);
      const basics =
        item.code === 'UK_GOV_CONVERSION'
          ? validateWorkbookBasics(sheetNames, ['Front page', 'Factors by Category'])
          : validateWorkbookBasics(sheetNames, ['Emission Factors Hub']);
      const targetSheetName =
        item.code === 'UK_GOV_CONVERSION' ? 'Factors by Category' : 'Emission Factors Hub';
      const worksheet = workbook.getWorksheet(targetSheetName);
      if (!worksheet) {
        throw new Error(`Missing sheet ${targetSheetName}`);
      }
      const rows = worksheetToRows(worksheet);
      const parsed =
        item.code === 'UK_GOV_CONVERSION'
          ? parseUkRows(rows, { ghgColumn: cfg.ukGhgColumn, dataYear: cfg.ukDataYear })
          : parseEpaRows(rows, cfg.epaDataYear);
      const issues: ValidationIssue[] = [...basics, ...(parsed.issues as ValidationIssue[])];
      await prisma.factorImportRun.update({ where: { id: run.id }, data: { status: issues.some(i => i.severity==='error') ? 'FAILED' : 'VALIDATED', validationJson: issues as any } });
      if (issues.some(i => i.severity==='error')) { results.push({ source:item.code, ok:false, issues }); continue; }
      const source = await upsertSource(organizationId, item);
      const count = await persistFactors(organizationId, source.id, parsed.factors);
      await prisma.factorImportRun.update({ where: { id: run.id }, data: { status:'IMPORTED', importedCount:count, validationJson: issues as any } });
      results.push({ source:item.code, ok:true, importedCount:count, issues });
    } catch (e:any) {
      await prisma.factorImportRun.update({ where: { id: run.id }, data: { status:'FAILED', errorMessage:e?.message || 'Unknown error' } });
      results.push({ source:item.code, ok:false, issues:[{ severity:'error', code:'IMPORT_EXCEPTION', message:e?.message || 'Unknown error' }] });
    }
  }
  const plSource = await upsertSource(organizationId, sources.pl);
  const kobizeFactors = buildKobizeParsedFactors(cfg.overlayYear);
  const kobizeCount = await persistFactors(organizationId, plSource.id, kobizeFactors as ParsedFactor[]);
  results.push({ source: 'KOBIZE_PL', ok: true, importedCount: kobizeCount, issues: [] });
  const importedCount = results.reduce(
    (sum, item) => sum + (typeof item.importedCount === 'number' ? item.importedCount : 0),
    0
  );
  await writeProcessingRecord({
    organizationId,
    actorUserId: actorUserId ?? null,
    eventType: 'FACTOR_IMPORT',
    subjectRef: 'external_factors',
    legalBasis: 'art. 6 ust. 1 lit. b RODO',
    payload: {
      importedCount,
      sources: results.map((item) => ({
        source: item.source,
        ok: item.ok,
        importedCount: typeof item.importedCount === 'number' ? item.importedCount : 0,
        issueCount: Array.isArray(item.issues) ? item.issues.length : 0,
      })),
    },
  });
  await createNotification({
    organizationId,
    userId: actorUserId ?? undefined,
    type: 'FACTOR_IMPORT_DONE',
    title: 'Import faktorow zakonczony',
    body: `Zaimportowano ${importedCount} rekordow z zewnetrznych zrodel.`,
    link: '/dashboard/report',
  });
  return { results };
}

export async function resolveBestFactor(
  organizationId: string,
  regionCode: string,
  categoryCode: string
): Promise<EmissionFactorWithSource | null> {
  const factors = await prisma.emissionFactor.findMany({
    where: { organizationId, categoryCode },
    include: { emissionSource: true },
    orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }],
  });
  return pickBestEmissionFactorForRegion(factors, regionCode);
}

/** Jedno zapytanie dla wielu kategorii — ten sam wybór co {@link resolveBestFactor}. */
export async function resolveBestFactorsForCategories(
  organizationId: string,
  regionCode: string,
  categoryCodes: string[]
): Promise<Map<string, EmissionFactorWithSource | null>> {
  const unique = [...new Set(categoryCodes)];
  const map = new Map<string, EmissionFactorWithSource | null>();
  if (unique.length === 0) return map;
  const allFactors = await prisma.emissionFactor.findMany({
    where: { organizationId, categoryCode: { in: unique } },
    include: { emissionSource: true },
    orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }],
  });
  const byCategory = new Map<string, EmissionFactorWithSource[]>();
  for (const f of allFactors) {
    const arr = byCategory.get(f.categoryCode) ?? [];
    arr.push(f);
    byCategory.set(f.categoryCode, arr);
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => {
      if (a.regionPriority !== b.regionPriority) return a.regionPriority - b.regionPriority;
      return b.year - a.year;
    });
  }
  for (const cat of unique) {
    const list = byCategory.get(cat) ?? [];
    map.set(cat, pickBestEmissionFactorForRegion(list, regionCode));
  }
  return map;
}
