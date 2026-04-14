import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parsePagination(req: NextRequest) {
  const page = Math.max(1, Number.parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(req.nextUrl.searchParams.get('pageSize') ?? '50', 10) || 50)
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const { page, pageSize, skip } = parsePagination(req);

  const [items, total] = await prisma.$transaction([
    prisma.emissionCalculation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.emissionCalculation.count({ where: { organizationId } }),
  ]);

  return NextResponse.json({
    ok: true,
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
