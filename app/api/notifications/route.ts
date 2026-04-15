import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  const where = readOnly
    ? {
        organizationId,
        userId,
        readAt: { not: null, lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }
    : { organizationId, userId };
  const result = await prisma.notification.deleteMany({ where });
  return NextResponse.json({ ok: true, deleted: result.count });
}
