import { withApiKey } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  return withApiKey(req, 'emissions:read', async (organizationId) => {
    const url = new URL(req.url);
    const year = Number(url.searchParams.get('year'));
    const scope = url.searchParams.get('scope');
    const dateFilter =
      Number.isFinite(year) && year >= 2000 && year <= 2100
        ? {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
            lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          }
        : undefined;

    const maxLines = 10_000;
    const lines = await prisma.invoiceLine.findMany({
      where: {
        invoice: {
          organizationId,
          ...(dateFilter ? { issueDate: dateFilter } : {}),
        },
        ...(scope ? { scope: scope as any } : {}),
      },
      include: { emissionFactor: true },
      take: maxLines + 1,
    });
    const truncated = lines.length > maxLines;
    const safeLines = truncated ? lines.slice(0, maxLines) : lines;

    const grouped = new Map<string, { category: string; scope: string; totalKgCO2e: number; lineCount: number }>();
    for (const line of safeLines) {
      const category = line.overrideCategoryCode ?? line.categoryCode;
      const factorValue = line.emissionFactor?.factorValue ?? 0;
      const kg =
        line.calculationMethod === 'ACTIVITY'
          ? (line.activityValue ?? 0) * factorValue
          : line.netValue * factorValue;
      const key = `${line.scope}:${category}`;
      const current = grouped.get(key);
      if (current) {
        current.totalKgCO2e += kg;
        current.lineCount += 1;
      } else {
        grouped.set(key, {
          category,
          scope: line.scope,
          totalKgCO2e: kg,
          lineCount: 1,
        });
      }
    }

    return Response.json({
      data: Array.from(grouped.values()).map((item) => ({
        ...item,
        totalKgCO2e: Number(item.totalKgCO2e.toFixed(2)),
        totalTCO2e: Number((item.totalKgCO2e / 1000).toFixed(2)),
        year: Number.isFinite(year) ? year : null,
      })),
      meta: {
        organizationId,
        year: Number.isFinite(year) ? year : null,
        generatedAt: new Date().toISOString(),
        truncated,
      },
    });
  });
}
