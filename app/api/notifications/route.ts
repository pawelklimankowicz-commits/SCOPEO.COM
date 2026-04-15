import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/security';

const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const organizationId = (session.user as any).organizationId as string;
  const userId = session.user.id as string;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { organizationId, userId },
      orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
      take: 20,
    }),
    prisma.notification.count({ where: { organizationId, userId, readAt: null } }),
  ]);

  return NextResponse.json({ ok: true, notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const organizationId = (session.user as any).organizationId as string;
  const userId = session.user.id as string;

  try {
    const body = markReadSchema.parse(await req.json());
    const result = await prisma.notification.updateMany({
      where: { id: { in: body.ids }, organizationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true, updated: result.count });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Invalid payload' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const organizationId = (session.user as any).organizationId as string;
  const userId = session.user.id as string;
  const readOnly = req.nextUrl.searchParams.get('readOnly') === 'true';
  const limit = await checkRateLimit(`notif-delete:${userId}`, { windowMs: 60_000, maxRequests: 5 });
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  if (!readOnly) {
    return NextResponse.json(
      { ok: false, error: 'Uzyj ?readOnly=true zeby usunac tylko przeczytane powiadomienia.' },
      { status: 400 }
    );
  }
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.notification.deleteMany({
    where: { organizationId, userId, readAt: { not: null, lt: cutoff } },
  });
  return NextResponse.json({ ok: true, deleted: result.count });
}
