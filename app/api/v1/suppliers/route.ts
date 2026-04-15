import { withApiKey } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  return withApiKey(req, 'suppliers:read', async (organizationId) => {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') ?? '50')));
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        select: { id: true, name: true, taxId: true },
      }),
      prisma.supplier.count({ where: { organizationId } }),
    ]);
    return Response.json({ data, meta: { total, page, limit } });
  });
}
