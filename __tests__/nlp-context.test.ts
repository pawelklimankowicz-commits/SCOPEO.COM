import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    supplierCategoryHint: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { classifyWithContext } from '@/lib/nlp-mapping';

describe('classifyWithContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses supplier hint when confidence/sample threshold is met', async () => {
    vi.mocked(prisma.supplierCategoryHint.findFirst).mockResolvedValueOnce({
      id: 'h1',
      categoryCode: 'scope2_electricity',
      confidence: 0.92,
      sampleCount: 5,
    } as any);
    const result = await classifyWithContext('abonament energia', 's1', 'o1');
    expect(result.source).toBe('supplier_hint');
    expect(result.categoryCode).toBe('scope2_electricity');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('falls back to nlp when no hint', async () => {
    vi.mocked(prisma.supplierCategoryHint.findFirst).mockResolvedValueOnce(null);
    const result = await classifyWithContext('energia elektryczna biuro kWh', 's1', 'o1');
    expect(['nlp', 'fallback']).toContain(result.source);
    expect(result.categoryCode).toBeTruthy();
    expect(result.reasoning).toContain('NLP');
    if (result.source === 'nlp') {
      expect((result.matchedTokens || []).length).toBeGreaterThan(0);
    }
  });
});
