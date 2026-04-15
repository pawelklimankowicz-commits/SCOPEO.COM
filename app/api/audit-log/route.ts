import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildAuditWhere, canAccessAudit, toAuditCsv } from '@/lib/audit-log';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!canAccessAudit(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const organizationId = (session.user as any).organizationId as string;

  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? '25');
  const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 25));
  const cursor = req.nextUrl.searchParams.get('cursor');
  const format = req.nextUrl.searchParams.get('format') ?? 'json';
  const where = buildAuditWhere({
    organizationId,
    from: req.nextUrl.searchParams.get('from'),
    to: req.nextUrl.searchParams.get('to'),
    eventType: req.nextUrl.searchParams.get('eventType'),
    search: req.nextUrl.searchParams.get('search'),
  });

  if (format === 'csv') {
    const csvLimit = 10_000;
    const rows = await prisma.processingRecord.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: csvLimit,
      select: {
        createdAt: true,
        eventType: true,
        subjectRef: true,
        legalBasis: true,
        payload: true,
      },
    });
    return new NextResponse(toAuditCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="audit-log.csv"',
      },
    });
  }

  const records = await prisma.processingRecord.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit + 1,
  });
  const pageItems = records.slice(0, limit);
  const nextCursor = records.length > limit ? records[limit]?.id ?? null : null;
  const total = await prisma.processingRecord.count({ where });

  return NextResponse.json({
    ok: true,
    data: pageItems,
    nextCursor,
    total,
  });
}
