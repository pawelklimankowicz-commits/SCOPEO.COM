import test from 'node:test';
import assert from 'node:assert/strict';
import { computeInvoiceLineCo2eKg } from '@/lib/emissions';

test('ACTIVITY uses activityValue * factor', () => {
  assert.equal(
    computeInvoiceLineCo2eKg({
      calculationMethod: 'ACTIVITY',
      activityValue: 10,
      netValue: 999,
      factorValue: 2.5,
    }),
    25
  );
});

test('SPEND uses netValue * factor', () => {
  assert.equal(
    computeInvoiceLineCo2eKg({
      calculationMethod: 'SPEND',
      activityValue: 100,
      netValue: 1000,
      factorValue: 0.001,
    }),
    1
  );
});

test('ACTIVITY treats null activity as 0', () => {
  assert.equal(
    computeInvoiceLineCo2eKg({
      calculationMethod: 'ACTIVITY',
      activityValue: null,
      netValue: 500,
      factorValue: 3,
    }),
    0
  );
});
