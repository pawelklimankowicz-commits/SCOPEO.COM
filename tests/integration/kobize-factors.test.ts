import test from 'node:test';
import assert from 'node:assert/strict';
import { buildKobizeParsedFactors } from '@/lib/kobize-pl-factors';

test('buildKobizeParsedFactors loads KOBiZE PL electricity factor', () => {
  const rows = buildKobizeParsedFactors(2025);
  const el = rows.find((r) => r.activityKind === 'electricity_kwh');
  assert.ok(el);
  assert.equal(el?.factorValue, 0.7309);
  assert.equal(el?.metadataJson?.unit_kgCO2_per_MWh, 730.9);
  assert.ok(String(el?.code).startsWith('PL_KOBIZE_ELEC_GRID_'));
});
