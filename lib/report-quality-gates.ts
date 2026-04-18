export type SnapshotQualityGates = {
  snapshotMinQualityScore: number;
  snapshotMinScope3CoveragePct: number;
  auditRiskMissingPctHigh: number;
};

export const DEFAULT_SNAPSHOT_MIN_QUALITY_SCORE = 75;
export const DEFAULT_SNAPSHOT_MIN_SCOPE3_COVERAGE_PCT = 60;
export const DEFAULT_AUDIT_RISK_MISSING_PCT_HIGH = 12;

export type AuditRiskLevel = 'none' | 'elevated' | 'high';

export function resolveAuditRiskLevel(
  missingImpactPct: number,
  highThresholdPct: number
): AuditRiskLevel {
  const t = Math.max(0, Number(highThresholdPct) || DEFAULT_AUDIT_RISK_MISSING_PCT_HIGH);
  if (missingImpactPct > t) return 'high';
  if (missingImpactPct > t * 0.5) return 'elevated';
  return 'none';
}

export function normalizeSnapshotGates(partial?: Partial<SnapshotQualityGates> | null): SnapshotQualityGates {
  return {
    snapshotMinQualityScore: clamp(
      partial?.snapshotMinQualityScore ?? DEFAULT_SNAPSHOT_MIN_QUALITY_SCORE,
      0,
      100
    ),
    snapshotMinScope3CoveragePct: clamp(
      partial?.snapshotMinScope3CoveragePct ?? DEFAULT_SNAPSHOT_MIN_SCOPE3_COVERAGE_PCT,
      0,
      100
    ),
    auditRiskMissingPctHigh: clamp(
      partial?.auditRiskMissingPctHigh ?? DEFAULT_AUDIT_RISK_MISSING_PCT_HIGH,
      0,
      100
    ),
  };
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export type SnapshotClosureBlock = {
  code: string;
  messagePl: string;
};

export function evaluateSnapshotClosureBlocks(
  result: {
    dataQuality?: { score?: number; impactByFlagPct?: { missing?: number } };
    scope3Completeness?: { summary?: { coveragePct?: number } };
  },
  gates: SnapshotQualityGates
): SnapshotClosureBlock[] {
  const errors: SnapshotClosureBlock[] = [];
  const score = Number(result.dataQuality?.score ?? 100);
  if (score < gates.snapshotMinQualityScore) {
    errors.push({
      code: 'SNAPSHOT_MIN_QUALITY_SCORE',
      messagePl: `Nie można zamknąć snapshotu: Data Quality Score (${score.toFixed(2)}) jest poniżej progu ${gates.snapshotMinQualityScore.toFixed(0)}.`,
    });
  }
  const s3 = Number(result.scope3Completeness?.summary?.coveragePct ?? 0);
  if (s3 < gates.snapshotMinScope3CoveragePct) {
    errors.push({
      code: 'SNAPSHOT_MIN_SCOPE3_COVERAGE',
      messagePl: `Nie można zamknąć snapshotu: pokrycie macierzy Scope 3 (${s3.toFixed(1)}%) jest poniżej progu ${gates.snapshotMinScope3CoveragePct.toFixed(0)}%.`,
    });
  }
  return errors;
}
