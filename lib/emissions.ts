import {
  DEFAULT_AUDIT_RISK_MISSING_PCT_HIGH,
  resolveAuditRiskLevel,
} from '@/lib/report-quality-gates';

function roundKg(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

function getAppBaseUrl() {
  const candidate =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3000';
  return candidate.replace(/\/+$/, '');
}

type EmissionEvidenceEntry = {
  evidenceId: string;
  co2eKg: number;
  scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
  categoryCode: string;
  calculationMethod: 'ACTIVITY' | 'SPEND';
  invoiceId: string;
  invoiceNumber: string;
  invoiceExternalId: string;
  invoiceIssueDate: string;
  invoiceSourceLink: string;
  lineId: string;
  lineDescription: string;
  factorId: string | null;
  factorCode: string | null;
  factorValue: number;
  factorUnit: string | null;
  methodologyVersion: string;
  emissionSourceCode: string | null;
  emissionSourceVersion: string | null;
  factorSourceLink: string | null;
};

type DataQualityFlag = 'estimated' | 'missing' | 'assumed';
type Scope3CoverageStatus = 'covered' | 'not_covered';

const SCOPE3_COMPLETENESS_DEFINITIONS: Array<{
  code: string;
  label: string;
  keywords: string[];
  defaultReason: string;
}> = [
  {
    code: 'scope3_cat1_purchased_goods_services',
    label: 'Cat. 1 Purchased goods and services',
    keywords: ['scope3_cat1_purchased_goods', 'scope3_cat1_purchased_services'],
    defaultReason: 'Brak danych zakupowych przypisanych do kategorii Cat.1 w okresie raportowania.',
  },
  {
    code: 'scope3_cat2_capital_goods',
    label: 'Cat. 2 Capital goods',
    keywords: ['scope3_cat2_capital_goods'],
    defaultReason: 'Brak pozycji inwestycyjnych/capital goods przypisanych do Cat.2.',
  },
  {
    code: 'scope3_cat3_fuel_energy_related',
    label: 'Cat. 3 Fuel- and energy-related activities',
    keywords: ['scope3_cat3_fuel_energy_related'],
    defaultReason: 'Brak odrebnego mapowania danych dla Cat.3.',
  },
  {
    code: 'scope3_cat4_upstream_transport',
    label: 'Cat. 4 Upstream transportation and distribution',
    keywords: ['scope3_cat4_transport'],
    defaultReason: 'Brak pozycji transportowych upstream zaklasyfikowanych do Cat.4.',
  },
  {
    code: 'scope3_cat5_waste',
    label: 'Cat. 5 Waste generated in operations',
    keywords: ['scope3_cat5_waste'],
    defaultReason: 'Brak pozycji odpadowych przypisanych do Cat.5.',
  },
  {
    code: 'scope3_cat6_business_travel',
    label: 'Cat. 6 Business travel',
    keywords: ['scope3_cat6_business_travel'],
    defaultReason: 'Brak danych o podrozach sluzbowych przypisanych do Cat.6.',
  },
  {
    code: 'scope3_cat7_employee_commuting',
    label: 'Cat. 7 Employee commuting',
    keywords: ['scope3_cat7_employee_commuting'],
    defaultReason: 'Brak danych commuting przypisanych do Cat.7.',
  },
  {
    code: 'scope3_cat8_upstream_leased_assets',
    label: 'Cat. 8 Upstream leased assets',
    keywords: ['scope3_cat8_upstream_leased_assets'],
    defaultReason: 'Brak danych aktywow leasingowanych upstream przypisanych do Cat.8.',
  },
  {
    code: 'scope3_cat9_downstream_transport',
    label: 'Cat. 9 Downstream transportation and distribution',
    keywords: ['scope3_cat9_downstream_transport'],
    defaultReason: 'Brak danych downstream transport przypisanych do Cat.9.',
  },
  {
    code: 'scope3_cat10_processing_sold_products',
    label: 'Cat. 10 Processing of sold products',
    keywords: ['scope3_cat10_processing_sold_products'],
    defaultReason: 'Brak danych processing sold products przypisanych do Cat.10.',
  },
  {
    code: 'scope3_cat11_use_of_sold_products',
    label: 'Cat. 11 Use of sold products',
    keywords: ['scope3_cat11_use_of_sold_products'],
    defaultReason: 'Brak danych use of sold products przypisanych do Cat.11.',
  },
  {
    code: 'scope3_cat12_end_of_life',
    label: 'Cat. 12 End-of-life treatment of sold products',
    keywords: ['scope3_cat12_end_of_life'],
    defaultReason: 'Brak danych end-of-life treatment przypisanych do Cat.12.',
  },
  {
    code: 'scope3_cat13_downstream_leased_assets',
    label: 'Cat. 13 Downstream leased assets',
    keywords: ['scope3_cat13_downstream_leased_assets'],
    defaultReason: 'Brak danych downstream leased assets przypisanych do Cat.13.',
  },
  {
    code: 'scope3_cat14_franchises',
    label: 'Cat. 14 Franchises',
    keywords: ['scope3_cat14_franchises'],
    defaultReason: 'Brak danych franchises przypisanych do Cat.14.',
  },
  {
    code: 'scope3_cat15_investments',
    label: 'Cat. 15 Investments',
    keywords: ['scope3_cat15_investments'],
    defaultReason: 'Brak danych inwestycyjnych przypisanych do Cat.15.',
  },
];

async function getPrisma() {
  const mod = await import('@/lib/prisma');
  return mod.prisma;
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
  scope2Location: number,
  scope2Market: number,
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
    s2lb: roundKg(scope2Location),
    s2mb: roundKg(scope2Market),
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
  const appBaseUrl = getAppBaseUrl();
  const prisma = await getPrisma();
  const carbonProfile = await prisma.carbonProfile.findUnique({
    where: { organizationId },
    select: {
      supportsMarketBased: true,
      hasGreenContracts: true,
      auditRiskMissingPctHigh: true,
    },
  });
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
  let scope2LocationKg = 0, scope2MarketKg = 0;
  const byCategory: Record<string, number> = {};
  const calculations = [] as any[];
  const evidenceEntries: EmissionEvidenceEntry[] = [];
  const dataQualityImpactKg: Record<DataQualityFlag, number> = {
    estimated: 0,
    missing: 0,
    assumed: 0,
  };
  const dataQualityFlagCounts: Record<DataQualityFlag, number> = {
    estimated: 0,
    missing: 0,
    assumed: 0,
  };
  const scopeEvidenceIds: Record<'SCOPE1' | 'SCOPE2' | 'SCOPE3', string[]> = {
    SCOPE1: [],
    SCOPE2: [],
    SCOPE3: [],
  };
  const categoryEvidenceIds: Record<string, string[]> = {};
  for (const line of lines) {
    const lineScope = line.scope as 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
    const categoryCode = line.overrideCategoryCode || line.categoryCode;
    const factorId = line.overrideFactorId || line.emissionFactorId;
    const factor = line.overrideFactorId
      ? factorById.get(line.overrideFactorId) ?? null
      : line.emissionFactor;
    const factorValue = factor?.factorValue ?? 0;
    const isScope2Electricity =
      lineScope === 'SCOPE2' &&
      ((factor?.activityKind ?? '') === 'electricity_kwh' ||
        categoryCode === 'scope2_electricity');
    const marketBasedFactorValueRaw =
      factor?.metadataJson &&
      typeof factor.metadataJson === 'object' &&
      !Array.isArray(factor.metadataJson)
        ? (factor.metadataJson as Record<string, unknown>).marketBasedFactorValue
        : undefined;
    const marketBasedFactorValue =
      typeof marketBasedFactorValueRaw === 'number' ? marketBasedFactorValueRaw : undefined;
    const qualityFlags: DataQualityFlag[] = [];
    if (line.estimated === true) qualityFlags.push('estimated');
    if (!factor?.id) qualityFlags.push('missing');
    if (line.calculationMethod === 'ACTIVITY' && (line.activityValue == null || Number(line.activityValue) === 0)) {
      qualityFlags.push('assumed');
    }
    const co2eKg = computeInvoiceLineCo2eKg({
      calculationMethod: line.calculationMethod,
      activityValue: line.activityValue,
      netValue: line.netValue,
      factorValue,
    });
    const supportsMarketBased = Boolean(carbonProfile?.supportsMarketBased);
    const hasGreenContracts = Boolean(carbonProfile?.hasGreenContracts);
    const scope2MarketLineKg =
      lineScope !== 'SCOPE2'
        ? 0
        : supportsMarketBased
          ? computeInvoiceLineCo2eKg({
              calculationMethod: line.calculationMethod,
              activityValue: line.activityValue,
              netValue: line.netValue,
              factorValue:
                marketBasedFactorValue ??
                (isScope2Electricity && hasGreenContracts ? 0 : factorValue),
            })
          : co2eKg;
    const evidenceId = `EV-LINE-${line.id}`;
    const methodologyVersion = factor?.emissionSource
      ? `${factor.emissionSource.code}@${factor.emissionSource.version}`
      : 'manual_or_missing_factor';
    const invoiceSourceLink = `${appBaseUrl}/dashboard/invoices?invoiceId=${encodeURIComponent(line.invoice.id)}`;
    const factorSourceLink = factor?.id
      ? `${appBaseUrl}/dashboard/factors?factorId=${encodeURIComponent(factor.id)}`
      : null;
    if (lineScope === 'SCOPE1') scope1 += co2eKg;
    if (lineScope === 'SCOPE2') {
      scope2 += co2eKg;
      scope2LocationKg += co2eKg;
      scope2MarketKg += scope2MarketLineKg;
    }
    if (lineScope === 'SCOPE3') scope3 += co2eKg;
    scopeEvidenceIds[lineScope].push(evidenceId);
    byCategory[categoryCode] = (byCategory[categoryCode] || 0) + co2eKg;
    if (!categoryEvidenceIds[categoryCode]) categoryEvidenceIds[categoryCode] = [];
    categoryEvidenceIds[categoryCode].push(evidenceId);
    for (const flag of qualityFlags) {
      dataQualityFlagCounts[flag] += 1;
      dataQualityImpactKg[flag] += co2eKg;
    }
    const qualityImpactClass: 'high' | 'medium' | 'low' =
      qualityFlags.length === 0
        ? 'low'
        : qualityFlags.includes('missing')
          ? 'high'
          : qualityFlags.includes('assumed')
            ? 'medium'
            : 'low';
    calculations.push({
      evidenceId,
      invoiceId: line.invoice.id,
      invoiceNumber: line.invoice.number,
      invoiceSourceLink,
      lineId: line.id,
      description: line.description,
      categoryCode,
      factorCode: factor?.code,
      factorSource: factor?.emissionSource?.code,
      factorVersion: factor?.emissionSource?.version ?? null,
      methodologyVersion,
      dataQualityFlags: qualityFlags,
      qualityImpactClass,
      reviewStatus: line.mappingDecision?.status,
      co2eKg,
    });
    evidenceEntries.push({
      evidenceId,
      co2eKg,
      scope: lineScope,
      categoryCode,
      calculationMethod: line.calculationMethod,
      invoiceId: line.invoice.id,
      invoiceNumber: line.invoice.number,
      invoiceExternalId: line.invoice.externalId,
      invoiceIssueDate: line.invoice.issueDate instanceof Date ? line.invoice.issueDate.toISOString() : String(line.invoice.issueDate),
      invoiceSourceLink,
      lineId: line.id,
      lineDescription: line.description,
      factorId: factor?.id ?? null,
      factorCode: factor?.code ?? null,
      factorValue,
      factorUnit: factor?.factorUnit ?? null,
      methodologyVersion,
      emissionSourceCode: factor?.emissionSource?.code ?? null,
      emissionSourceVersion: factor?.emissionSource?.version ?? null,
      factorSourceLink,
    });
  }
  const totalKg = scope1 + scope2 + scope3;
  const scope3CategoryTotals = Object.keys(byCategory)
    .filter((categoryCode) => categoryCode.startsWith('scope3_'))
    .reduce<Record<string, number>>((acc, categoryCode) => {
      acc[categoryCode] = byCategory[categoryCode] ?? 0;
      return acc;
    }, {});
  const scope3CompletenessMatrix = SCOPE3_COMPLETENESS_DEFINITIONS.map((definition) => {
    const matchedCodes = Object.keys(scope3CategoryTotals).filter((code) =>
      definition.keywords.some((keyword) => code.includes(keyword))
    );
    const coveredKg = matchedCodes.reduce((sum, code) => sum + (scope3CategoryTotals[code] ?? 0), 0);
    const status: Scope3CoverageStatus = coveredKg > 0 ? 'covered' : 'not_covered';
    const reason =
      status === 'covered'
        ? `Pokryto na podstawie kategorii: ${matchedCodes.join(', ')}; suma ${coveredKg.toFixed(2)} kgCO2e.`
        : definition.defaultReason;
    return {
      categoryCode: definition.code,
      categoryLabel: definition.label,
      status,
      coveredKg,
      matchedCategories: matchedCodes,
      reason,
    };
  });
  const scope3Covered = scope3CompletenessMatrix.filter((item) => item.status === 'covered').length;
  const scope3Total = scope3CompletenessMatrix.length;
  const scope3CompletenessSummary = {
    coveredCount: scope3Covered,
    totalCount: scope3Total,
    coveragePct: scope3Total > 0 ? (scope3Covered / scope3Total) * 100 : 0,
  };
  const totalMarketBasedKg = scope1 + scope2MarketKg + scope3;
  const totalFlaggedImpactKg = dataQualityImpactKg.estimated + dataQualityImpactKg.missing + dataQualityImpactKg.assumed;
  const flaggedImpactPct = totalKg > 0 ? (totalFlaggedImpactKg / totalKg) * 100 : 0;
  const dataQualityScore = Math.max(0, Math.min(100, Number((100 - flaggedImpactPct).toFixed(2))));
  const missingImpactPct = totalKg > 0 ? (dataQualityImpactKg.missing / totalKg) * 100 : 0;
  const auditRiskMissingPctThreshold = Number(
    carbonProfile?.auditRiskMissingPctHigh ?? DEFAULT_AUDIT_RISK_MISSING_PCT_HIGH
  );
  const auditRisk = resolveAuditRiskLevel(missingImpactPct, auditRiskMissingPctThreshold);
  const dataQuality = {
    score: dataQualityScore,
    flaggedImpactKg: totalFlaggedImpactKg,
    flaggedImpactPct,
    impactByFlagKg: dataQualityImpactKg,
    impactByFlagPct: {
      estimated: totalKg > 0 ? (dataQualityImpactKg.estimated / totalKg) * 100 : 0,
      missing: missingImpactPct,
      assumed: totalKg > 0 ? (dataQualityImpactKg.assumed / totalKg) * 100 : 0,
    },
    lineCountsByFlag: dataQualityFlagCounts,
    flagDefinitions: {
      estimated: 'Wartosc oznaczona jako estymowana przez proces klasyfikacji.',
      missing: 'Brak przypisanego faktora emisji dla pozycji.',
      assumed: 'Wartosc aktywnosci wyliczona z zalozenia lub domyslnie 0 (metoda ACTIVITY).',
    },
    auditRisk,
    auditRiskMissingPctThreshold: auditRiskMissingPctThreshold,
    auditRiskLabel:
      auditRisk === 'high'
        ? 'audit-risk high'
        : auditRisk === 'elevated'
          ? 'audit-risk elevated'
          : 'audit-risk none',
  };
  const aggregateEvidence = {
    total: {
      evidenceId: 'EV-TOTAL',
      valueKg: totalKg,
      sourceEvidenceIds: evidenceEntries.map((entry) => entry.evidenceId),
    },
    scope1: {
      evidenceId: 'EV-SCOPE1',
      valueKg: scope1,
      sourceEvidenceIds: scopeEvidenceIds.SCOPE1,
    },
    scope2: {
      evidenceId: 'EV-SCOPE2',
      valueKg: scope2LocationKg,
      sourceEvidenceIds: scopeEvidenceIds.SCOPE2,
    },
    scope2LocationBased: {
      evidenceId: 'EV-SCOPE2-LB',
      valueKg: scope2LocationKg,
      sourceEvidenceIds: scopeEvidenceIds.SCOPE2,
    },
    scope2MarketBased: {
      evidenceId: 'EV-SCOPE2-MB',
      valueKg: scope2MarketKg,
      sourceEvidenceIds: scopeEvidenceIds.SCOPE2,
    },
    scope3: {
      evidenceId: 'EV-SCOPE3',
      valueKg: scope3,
      sourceEvidenceIds: scopeEvidenceIds.SCOPE3,
    },
    categories: Object.keys(byCategory)
      .sort()
      .map((categoryCode) => ({
        categoryCode,
        evidenceId: `EV-CAT-${categoryCode}`,
        valueKg: byCategory[categoryCode],
        sourceEvidenceIds: categoryEvidenceIds[categoryCode] ?? [],
      })),
  };
  const summaryPayload = {
    byCategory,
    calculations,
    reportYear: reportYear ?? null,
    evidenceTrail: {
      aggregateEvidence,
      entries: evidenceEntries,
    },
    dataQuality,
    scope3Completeness: {
      summary: scope3CompletenessSummary,
      matrix: scope3CompletenessMatrix,
    },
    scope2Breakdown: {
      supportsMarketBased: Boolean(carbonProfile?.supportsMarketBased),
      hasGreenContracts: Boolean(carbonProfile?.hasGreenContracts),
      locationBasedKg: scope2LocationKg,
      marketBasedKg: scope2MarketKg,
      deltaKg: scope2MarketKg - scope2LocationKg,
      totalLocationBasedKg: totalKg,
      totalMarketBasedKg,
    },
  };

  let snapshot:
    | { persisted: true }
    | { persisted: false; skippedDuplicate: true }
    | undefined;

  if (options.persist === true) {
    const fp = emissionPersistFingerprint(
      scope1,
      scope2LocationKg,
      scope2MarketKg,
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
        ((last.summaryJson as any)?.scope2Breakdown?.marketBasedKg as number | undefined) ?? last.scope2Kg,
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
    scope2LocationKg,
    scope2MarketKg,
    scope3,
    totalKg,
    byCategory,
    calculations,
    dataQuality,
    scope3Completeness: {
      summary: scope3CompletenessSummary,
      matrix: scope3CompletenessMatrix,
    },
    scope2Breakdown: {
      supportsMarketBased: Boolean(carbonProfile?.supportsMarketBased),
      hasGreenContracts: Boolean(carbonProfile?.hasGreenContracts),
      locationBasedKg: scope2LocationKg,
      marketBasedKg: scope2MarketKg,
      deltaKg: scope2MarketKg - scope2LocationKg,
      totalLocationBasedKg: totalKg,
      totalMarketBasedKg,
    },
    evidenceTrail: {
      aggregateEvidence,
      entries: evidenceEntries,
    },
    lineCount: lines.length,
    maxLines,
    truncated,
    reportYear: reportYear ?? null,
    snapshot,
  };
}