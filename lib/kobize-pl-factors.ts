import fs from 'fs';
import path from 'path';

type KobizeFactorRow = {
  codeSuffix: string;
  name: string;
  scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
  categoryCode: string;
  factorValue: number;
  factorUnit: string;
  region: string;
  regionPriority: number;
  activityKind?: string;
  year: number;
  tags?: string;
  metadataJson?: Record<string, unknown>;
};

export type KobizeFactorsFile = {
  schemaVersion: number;
  factors: KobizeFactorRow[];
};

/** Parsed factor row compatible with `lib/factor-import` `ParsedFactor`. */
export type KobizeParsedFactor = {
  code: string;
  name: string;
  scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
  categoryCode: string;
  factorValue: number;
  factorUnit: string;
  region: string;
  regionPriority: number;
  activityKind?: string;
  year: number;
  tags?: string;
  metadataJson?: Record<string, unknown>;
};

export function loadKobizeFactorsFile(): KobizeFactorsFile {
  const customPath = process.env.KOBIZE_FACTORS_JSON_PATH?.trim();
  const defaultPath = path.join(process.cwd(), 'data', 'kobize-pl-factors.json');
  const filePath = customPath || defaultPath;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as KobizeFactorsFile;
}

/**
 * Krajowe współczynniki z pliku JSON (domyślnie `data/kobize-pl-factors.json`).
 * Uzupełnianie corocznie z materiałów KOBiZE (np. wskaźniki dla energii elektrycznej).
 */
export function buildKobizeParsedFactors(overlayYear: number): KobizeParsedFactor[] {
  const file = loadKobizeFactorsFile();
  return file.factors.map((f) => ({
    code: `PL_KOBIZE_${f.codeSuffix}_${f.year}`,
    name: f.name,
    scope: f.scope,
    categoryCode: f.categoryCode,
    factorValue: f.factorValue,
    factorUnit: f.factorUnit,
    region: f.region,
    regionPriority: f.regionPriority,
    activityKind: f.activityKind,
    year: f.year,
    tags: f.tags,
    metadataJson: {
      ...f.metadataJson,
      overlayImportYear: overlayYear,
    },
  }));
}
