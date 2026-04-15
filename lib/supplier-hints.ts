import { prisma } from '@/lib/prisma';

export async function applySupplierHintFeedback(input: {
  organizationId: string;
  supplierId: string;
  categoryCode: string;
}) {
  const existingHint = await prisma.supplierCategoryHint.findUnique({
    where: {
      organizationId_supplierId_categoryCode: {
        organizationId: input.organizationId,
        supplierId: input.supplierId,
        categoryCode: input.categoryCode,
      },
    },
    select: { confidence: true },
  });

  await prisma.supplierCategoryHint.upsert({
    where: {
      organizationId_supplierId_categoryCode: {
        organizationId: input.organizationId,
        supplierId: input.supplierId,
        categoryCode: input.categoryCode,
      },
    },
    update: {
      sampleCount: { increment: 1 },
      confidence: {
        set: Math.min(1, Number(existingHint?.confidence ?? 0.9) + 0.1),
      },
    },
    create: {
      organizationId: input.organizationId,
      supplierId: input.supplierId,
      categoryCode: input.categoryCode,
      confidence: 1,
      sampleCount: 1,
    },
  });
}
