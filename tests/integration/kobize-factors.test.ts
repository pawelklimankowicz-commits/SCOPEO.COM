import test from 'node:test';
import assert from 'node:assert/strict';
import { buildKobizeParsedFactors } from '@/lib/kobize-pl-factors';

test('buildKobizeParsedFactors loads KOBiZE PL electricity (597 g/kWh → 0.597 kg/kWh)', () => {
  const rows = buildKobizeParsedFactors(2025);
  const el = rows.find((r) => r.activityKind === 'electricity_kwh');
  assert.ok(el);
  assert.equal(el?.factorValue, 0.597);
  assert.equal(el?.metadataJson?.co2KgPerMwh, 597);
  assert.ok(String(el?.code).startsWith('PL_KOBIZE_ELECTRICITY_GRID_CONSUMER_'));
});
