import { describe, it, expect } from 'vitest';
import { computeInvoiceLineCo2eKg } from '@/lib/emissions';

describe('computeInvoiceLineCo2eKg', () => {
  it('ACTIVITY method: activityValue * factorValue', () => {
    expect(
      computeInvoiceLineCo2eKg({
        calculationMethod: 'ACTIVITY',
        activityValue: 100,
        netValue: 500,
        factorValue: 0.7309,
      })
    ).toBeCloseTo(73.09, 4);
  });

  it('SPEND method: netValue * factorValue', () => {
    expect(
      computeInvoiceLineCo2eKg({
        calculationMethod: 'SPEND',
        activityValue: null,
        netValue: 1000,
        factorValue: 0.001,
      })
    ).toBeCloseTo(1.0, 4);
  });

  it('ACTIVITY method with null activityValue returns 0', () => {
    expect(
      computeInvoiceLineCo2eKg({
        calculationMethod: 'ACTIVITY',
        activityValue: null,
        netValue: 500,
        factorValue: 0.7309,
      })
    ).toBe(0);
  });

  it('zero factorValue returns 0', () => {
    expect(
      computeInvoiceLineCo2eKg({
        calculationMethod: 'SPEND',
        activityValue: null,
        netValue: 1000,
        factorValue: 0,
      })
    ).toBe(0);
  });
});
