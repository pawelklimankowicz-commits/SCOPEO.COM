import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    supplierCategoryHint: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { applySupplierHintFeedback } from '@/lib/supplier-hints';

describe('applySupplierHintFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increments sampleCount for existing hint', async () => {
    vi.mocked(prisma.supplierCategoryHint.findUnique).mockResolvedValueOnce({ confidence: 0.8 } as any);
    vi.mocked(prisma.supplierCategoryHint.upsert).mockResolvedValueOnce({} as any);

    await applySupplierHintFeedback({
      organizationId: 'org1',
      supplierId: 'sup1',
      categoryCode: 'scope2_electricity',
    });

    expect(prisma.supplierCategoryHint.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          sampleCount: { increment: 1 },
        }),
      })
    );
  });
});
