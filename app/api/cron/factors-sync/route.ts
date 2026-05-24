import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { fetchAndParseSources, importParsedFactorsForOrg } from '@/lib/factor-import';
import { assertProductionCronEnv } from '@/lib/production-env';

export const maxDuration = 120;

export async function GET(req: Request) {
  assertProductionCronEnv();
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const organizations = await prisma.organization.findMany({
    where: {
      subscription: { status: { in: ['ACTIVE', 'TRIALING'] } },
    },
    select: { id: true },
  });

  if (!organizations.length) {
    return NextResponse.json({ ok: true, message: 'No active organizations', synced: 0 });
  }

  const { cfg, parsed } = await fetchAndParseSources();
  const hasFactors = parsed.some((p) => p.factors.length > 0);
  if (!hasFactors) {
    logger.info({
      context: 'cron_factors_sync',
      message: 'All sources returned zero factors — skipping org sync',
      issues: parsed.flatMap((p) => p.issues),
    });
    return NextResponse.json({ ok: false, error: 'No factors parsed from any source' }, { status: 502 });
  }

  const results: { orgId: string; ok: boolean; importedCount?: number; error?: string }[] = [];
  for (const org of organizations) {
    try {
      const { results: importResults } = await importParsedFactorsForOrg(org.id, parsed);
      const total = importResults.reduce(
        (sum, r) => sum + (typeof r.importedCount === 'number' ? r.importedCount : 0),
        0
      );
      results.push({ orgId: org.id, ok: true, importedCount: total });
    } catch (e: any) {
      results.push({ orgId: org.id, ok: false, error: e?.message || 'Unknown error' });
    }
  }

  const synced = results.filter((r) => r.ok).length;
  const totalFactors = results.reduce((sum, r) => sum + (r.importedCount ?? 0), 0);

  logger.info({
    context: 'cron_factors_sync',
    message: `Synced factors for ${synced}/${organizations.length} organizations`,
    dataYear: cfg.overlayYear,
    totalFactors,
  });

  return NextResponse.json({
    ok: true,
    synced,
    total: organizations.length,
    totalFactors,
    results,
  });
}
