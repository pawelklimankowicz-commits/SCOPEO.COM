import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';

type EmissionsResult = {
  scope1: number;
  scope2: number;
  scope2LocationKg?: number;
  scope2MarketKg?: number;
  scope3: number;
  totalKg: number;
  byCategory: Record<string, number>;
  calculations: Array<Record<string, unknown>>;
  dataQuality?: Record<string, unknown>;
  scope3Completeness?: Record<string, unknown>;
  lineCount: number;
  reportYear: number | null;
  evidenceTrail?: unknown;
  scope2Breakdown?: Record<string, unknown>;
};

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableSerialize(v)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashSnapshotPayload(payload: unknown): string {
  return createHash('sha256').update(stableSerialize(payload)).digest('hex');
}

export async function createImmutableReportSnapshot(params: {
  organizationId: string;
  authorUserId: string;
  authorEmail?: string | null;
  reportYear?: number;
  result: EmissionsResult;
}) {
  const latest = await prisma.emissionReportSnapshot.findFirst({
    where: { organizationId: params.organizationId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const nextVersion = (latest?.version ?? 0) + 1;
  const nowIso = new Date().toISOString();
  const canonicalPayload = {
    meta: {
      organizationId: params.organizationId,
      reportYear: params.reportYear ?? params.result.reportYear ?? null,
      version: nextVersion,
      approvedAt: nowIso,
      authorUserId: params.authorUserId,
      authorEmail: params.authorEmail ?? null,
      standard: 'GHG Protocol Corporate Standard',
    },
    totals: {
      scope1Kg: params.result.scope1,
      scope2Kg: params.result.scope2LocationKg ?? params.result.scope2,
      scope2LocationKg: params.result.scope2LocationKg ?? params.result.scope2,
      scope2MarketKg: params.result.scope2MarketKg ?? params.result.scope2,
      scope3Kg: params.result.scope3,
      totalKg: params.result.totalKg,
    },
    byCategory: Object.keys(params.result.byCategory)
      .sort()
      .reduce<Record<string, number>>((acc, key) => {
        acc[key] = params.result.byCategory[key] ?? 0;
        return acc;
      }, {}),
    lineCount: params.result.lineCount,
    calculations: params.result.calculations,
    dataQuality: params.result.dataQuality ?? null,
    scope3Completeness: params.result.scope3Completeness ?? null,
    scope2Breakdown: params.result.scope2Breakdown ?? null,
    evidenceTrail: params.result.evidenceTrail ?? null,
  };
  const hashSha256 = hashSnapshotPayload(canonicalPayload);

  const existing = await prisma.emissionReportSnapshot.findUnique({
    where: {
      organizationId_hashSha256: {
        organizationId: params.organizationId,
        hashSha256,
      },
    },
    select: { id: true, version: true, hashSha256: true, approvedAt: true },
  });
  if (existing) {
    return { created: false as const, snapshot: existing };
  }

  const created = await prisma.emissionReportSnapshot.create({
    data: {
      organizationId: params.organizationId,
      reportYear: params.reportYear ?? params.result.reportYear ?? null,
      version: nextVersion,
      hashSha256,
      authorUserId: params.authorUserId,
      authorEmail: params.authorEmail ?? null,
      approvedAt: new Date(nowIso),
      scope1Kg: params.result.scope1,
      scope2Kg: params.result.scope2LocationKg ?? params.result.scope2,
      scope3Kg: params.result.scope3,
      totalKg: params.result.totalKg,
      payloadJson: canonicalPayload as object,
    },
    select: {
      id: true,
      version: true,
      hashSha256: true,
      approvedAt: true,
      createdAt: true,
      reportYear: true,
      authorUserId: true,
      authorEmail: true,
    },
  });
  return { created: true as const, snapshot: created };
}
