import { prisma } from '@/lib/prisma';

function roundKg(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

/** Pure CO₂e (kg) for one invoice line — used by `calculateOrganizationEmissions` and tests. */
export function computeInvoiceLineCo2eKg(params: {
  calculationMethod: 'ACTIVITY' | 'SPEND';
  activityValue: number | null;
  netValue: number;
  factorValue: number;
}): number {
  return params.calculationMethod === 'ACTIVITY'
    ? (params.activityValue ?? 0) * params.factorValue
    : params.netValue * params.factorValue;
}

/** Porównanie z ostatnim zapisem — unika duplikatów przy wielokrotnym „Zapisz snapshot”. */
function emissionPersistFingerprint(
  scope1: number,
  scope2: number,
  scope3: number,
  totalKg: number,
  byCategory: Record<string, number>,
  reportYear: number | null
) {
  const sortedCat = Object.keys(byCategory)
    .sort()
    .reduce(
      (acc, k) => {
        acc[k] = roundKg(byCategory[k] ?? 0);
        return acc;
      },
      {} as Record<string, number>
    );
  return JSON.stringify({
    s1: roundKg(scope1),
    s2: roundKg(scope2),
    s3: roundKg(scope3),
    t: roundKg(totalKg),
    ry: reportYear,
    cat: sortedCat,
  });
}

export async function calculateOrganizationEmissions(
  organizationId: string,
  reportYear?: number,
  options: { persist?: boolean; maxLines?: number; pageSize?: number } = { persist: false }
) {
  const maxLines = Math.max(
    1,
    Math.min(
      Math.floor(
        Number(
          options.maxLines ??
            process.env.EMISSIONS_MAX_LINES ??
            // Safety default for API responses/exports.
            '10000'
        )
      ) || 10000,
      10000
    )
  );
  const pageSize = Math.max(100, Math.min(Math.floor(Number(options.pageSize) || 1000), 5000));
  const dateFilter =
    reportYear && Number.isInteger(reportYear)
      ? {
          gte: new Date(`${reportYear}-01-01T00:00:00.000Z`),
          lt: new Date(`${reportYear + 1}-01-01T00:00:00.000Z`),
        }
      : undefined;
  const lines: any[] = [];
  let cursorId: string | null = null;
  while (lines.length < maxLines) {
    const remaining = maxLines - lines.length;
    const batch: any[] = await prisma.invoiceLine.findMany({
      where: { invoice: { organizationId, ...(dateFilter ? { issueDate: dateFilter } : {}) } },
      include: {
        emissionFactor: { include: { emissionSource: true } },
        mappingDecision: true,
        invoice: true,
      },
      orderBy: { id: 'asc' },
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      take: Math.min(pageSize, remaining),
    });
    if (batch.length === 0) break;
    lines.push(...batch);
    cursorId = batch[batch.length - 1]?.id ?? null;
    if (batch.length < Math.min(pageSize, remaining)) break;
  }

  const truncated =
    lines.length === maxLines &&
    Boolean(
      await prisma.invoiceLine.findFirst({
        where: { invoice: { organizationId, ...(dateFilter ? { issueDate: dateFilter } : {}) } },
        orderBy: { id: 'asc' },
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        select: { id: true },
      })
    );
  const overrideFactorIds = Array.from(
    new Set(lines.map((line) => line.overrideFactorId).filter((id): id is string => Boolean(id)))
  );
  const overrideFactors = overrideFactorIds.length
    ? await prisma.emissionFactor.findMany({
        where: { id: { in: overrideFactorIds } },
        include: { emissionSource: true },
      })
    : [];
  const factorById = new Map(overrideFactors.map((factor) => [factor.id, factor]));
  let scope1 = 0, scope2 = 0, scope3 = 0;
  const byCategory: Record<string, number> = {};
  const calculations = [] as any[];
  for (const line of lines) {
    const categoryCode = line.overrideCategoryCode || line.categoryCode;
    const factorId = line.overrideFactorId || line.emissionFactorId;
    const factor = line.overrideFactorId
      ? factorById.get(line.overrideFactorId) ?? null
      : line.emissionFactor;
    const factorValue = factor?.factorValue ?? 0;
    const co2eKg = computeInvoiceLineCo2eKg({
      calculationMethod: line.calculationMethod,
      activityValue: line.activityValue,
      netValue: line.netValue,
      factorValue,
    });
    if (line.scope === 'SCOPE1') scope1 += co2eKg;
    if (line.scope === 'SCOPE2') scope2 += co2eKg;
    if (line.scope === 'SCOPE3') scope3 += co2eKg;
    byCategory[categoryCode] = (byCategory[categoryCode] || 0) + co2eKg;
    calculations.push({ invoiceNumber: line.invoice.number, description: line.description, categoryCode, factorCode: factor?.code, factorSource: factor?.emissionSource?.code, reviewStatus: line.mappingDecision?.status, co2eKg });
  }
  const totalKg = scope1 + scope2 + scope3;
  const summaryPayload = { byCategory, calculations, reportYear: reportYear ?? null };

  let snapshot:
    | { persisted: true }
    | { persisted: false; skippedDuplicate: true }
    | undefined;

  if (options.persist === true) {
    const fp = emissionPersistFingerprint(
      scope1,
      scope2,
      scope3,
      totalKg,
      byCategory,
      reportYear ?? null
    );
    const last = await prisma.emissionCalculation.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    let skipInsert = false;
    if (last) {
      const prev = last.summaryJson as { byCategory?: Record<string, number>; reportYear?: number | null };
      const lastFp = emissionPersistFingerprint(
        last.scope1Kg,
        last.scope2Kg,
        last.scope3Kg,
        last.totalKg,
        prev?.byCategory ?? {},
        prev?.reportYear ?? null
      );
      if (lastFp === fp) skipInsert = true;
    }
    if (!skipInsert) {
      await prisma.emissionCalculation.create({
        data: {
          organizationId,
          scope1Kg: scope1,
          scope2Kg: scope2,
          scope3Kg: scope3,
          totalKg,
          summaryJson: summaryPayload as object,
        },
      });
      snapshot = { persisted: true };
    } else {
      snapshot = { persisted: false, skippedDuplicate: true };
    }
  }

  return {
    scope1,
    scope2,
    scope3,
    totalKg,
    byCategory,
    calculations,
    lineCount: lines.length,
    maxLines,
    truncated,
    reportYear: reportYear ?? null,
    snapshot,
  };
}