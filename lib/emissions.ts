import { prisma } from '@/lib/prisma';
export async function calculateOrganizationEmissions(organizationId: string) {
  const lines = await prisma.invoiceLine.findMany({ where: { invoice: { organizationId } }, include: { emissionFactor: { include: { emissionSource: true } }, mappingDecision: true, invoice: true } });
  let scope1 = 0, scope2 = 0, scope3 = 0;
  const byCategory: Record<string, number> = {};
  const calculations = [] as any[];
  for (const line of lines) {
    const categoryCode = line.overrideCategoryCode || line.categoryCode;
    const factorId = line.overrideFactorId || line.emissionFactorId;
    const factor = factorId ? await prisma.emissionFactor.findUnique({ where: { id: factorId }, include: { emissionSource: true } }) : null;
    const factorValue = factor?.factorValue ?? 0;
    const co2eKg = line.calculationMethod === 'ACTIVITY' ? (line.activityValue ?? 0) * factorValue : line.netValue * factorValue;
    if (line.scope === 'SCOPE1') scope1 += co2eKg;
    if (line.scope === 'SCOPE2') scope2 += co2eKg;
    if (line.scope === 'SCOPE3') scope3 += co2eKg;
    byCategory[categoryCode] = (byCategory[categoryCode] || 0) + co2eKg;
    calculations.push({ invoiceNumber: line.invoice.number, description: line.description, categoryCode, factorCode: factor?.code, factorSource: factor?.emissionSource?.code, reviewStatus: line.mappingDecision?.status, co2eKg });
  }
  const totalKg = scope1 + scope2 + scope3;
  await prisma.emissionCalculation.create({ data: { organizationId, scope1Kg: scope1, scope2Kg: scope2, scope3Kg: scope3, totalKg, summaryJson: JSON.stringify({ byCategory, calculations }) } });
  return { scope1, scope2, scope3, totalKg, byCategory, calculations };
}