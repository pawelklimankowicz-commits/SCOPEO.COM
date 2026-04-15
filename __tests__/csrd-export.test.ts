import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateCsrdReport, toCsrdCsv, toEsrsXml } from '@/lib/csrd-export';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    carbonProfile: {
      findUnique: vi.fn(),
    },
    invoiceLine: {
      findMany: vi.fn(),
    },
  },
}));

describe('csrd export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates scope totals from kg to tCO2e', async () => {
    vi.mocked(prisma.carbonProfile.findUnique).mockResolvedValue({
      companyName: 'Acme',
      taxId: '1234567890',
    } as any);
    vi.mocked(prisma.invoiceLine.findMany).mockResolvedValue([
      {
        scope: 'SCOPE1',
        categoryCode: 'scope1_fuel',
        overrideCategoryCode: null,
        calculationMethod: 'SPEND',
        netValue: 1000,
        activityValue: null,
        emissionFactorId: 'f1',
        overrideFactorId: null,
        emissionFactor: { factorValue: 2, emissionSource: { code: 'KOBIZE' }, year: 2024 },
        invoice: {},
      },
    ] as any);

    const report = await generateCsrdReport('org1', 2024);
    expect(report.scope1Total).toBe(2);
  });

  it('includes top disclosure rows in CSV', () => {
    const csv = toCsrdCsv({
      organizationId: 'org1',
      reportYear: 2024,
      generatedAt: new Date().toISOString(),
      organizationName: 'Acme',
      taxId: null,
      scope1Total: 1,
      scope2Total: 2,
      scope3Total: 3,
      totalGhg: 6,
      byCategory: [],
      methodology: 'GHG Protocol Corporate Standard',
      dataQuality: 'CALCULATED',
      boundaryApproach: 'OPERATIONAL_CONTROL',
    });
    expect(csv).toContain('Gross Scope 1 GHG emissions');
    expect(csv).toContain('Gross Scope 2 GHG emissions (location-based)');
    expect(csv).toContain('Gross Scope 3 GHG emissions');
    expect(csv).toContain('Total GHG emissions');
  });

  it('returns XML report structure', () => {
    const xml = toEsrsXml({
      organizationId: 'org1',
      reportYear: 2024,
      generatedAt: new Date().toISOString(),
      organizationName: 'Acme',
      taxId: '123',
      scope1Total: 1,
      scope2Total: 2,
      scope3Total: 3,
      totalGhg: 6,
      byCategory: [],
      methodology: 'GHG Protocol Corporate Standard',
      dataQuality: 'CALCULATED',
      boundaryApproach: 'OPERATIONAL_CONTROL',
    });
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<esrs:Report');
    expect(xml).toContain('</esrs:Report>');
  });
});
