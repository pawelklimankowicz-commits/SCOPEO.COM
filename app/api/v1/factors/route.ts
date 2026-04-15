import { withApiKey } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  return withApiKey(req, 'factors:read', async (organizationId) => {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') ?? '50')));
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.emissionFactor.findMany({
        where: { organizationId },
        include: { emissionSource: true },
        orderBy: [{ categoryCode: 'asc' }, { year: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.emissionFactor.count({ where: { organizationId } }),
    ]);
    return Response.json({
      data: data.map((item) => ({
        id: item.id,
        code: item.code,
        categoryCode: item.categoryCode,
        scope: item.scope,
        factorValue: item.factorValue,
        factorUnit: item.factorUnit,
        year: item.year,
        source: item.emissionSource.code,
      })),
      meta: { total, page, limit },
    });
  });
}
