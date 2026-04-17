import { calculateOrganizationEmissions } from '@/lib/emissions';
import { prisma } from '@/lib/prisma';

export { BASE_YEAR_RECALCULATION_POLICY } from '@/lib/base-year-recalculation-policy';

type CreateBaseYearRecalculationInput = {
  organizationId: string;
  authorUserId: string;
  authorEmail?: string | null;
  previousBaseYear: number;
  newBaseYear: number;
  triggerType: string;
  reason: string;
};

export async function createBaseYearRecalculationLog(input: CreateBaseYearRecalculationInput) {
  const previousResult = await calculateOrganizationEmissions(input.organizationId, input.previousBaseYear);
  const newResult = await calculateOrganizationEmissions(input.organizationId, input.newBaseYear);

  const previousTotalKg = previousResult.totalKg;
  const newTotalKg = newResult.totalKg;
  const deltaKg = newTotalKg - previousTotalKg;
  const deltaPct = previousTotalKg > 0 ? (deltaKg / previousTotalKg) * 100 : 0;
  const materialThresholdExceeded = Math.abs(deltaPct) >= 5;

  const impactSummary = {
    previousTotalKg,
    newTotalKg,
    deltaKg,
    deltaPct,
    materialThresholdExceeded,
    generatedAt: new Date().toISOString(),
    methodology: 'Recalculated with current factors and methodology baseline.',
  };

  await prisma.carbonProfile.update({
    where: { organizationId: input.organizationId },
    data: { baseYear: input.newBaseYear },
  });

  const logEntry = await prisma.baseYearRecalculationLog.create({
    data: {
      organizationId: input.organizationId,
      previousBaseYear: input.previousBaseYear,
      newBaseYear: input.newBaseYear,
      triggerType: input.triggerType,
      reason: input.reason,
      impactSummaryJson: impactSummary,
      authorUserId: input.authorUserId,
      authorEmail: input.authorEmail ?? null,
    },
  });

  return { logEntry, impactSummary };
}
