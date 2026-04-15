import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  label: z.string().min(2).optional(),
  isDefault: z.boolean().optional(),
});

function canManage(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const organizationId = (session.user as any).organizationId as string;
  const { connectionId } = await params;
  const target = await prisma.ksefConnection.findFirst({
    where: { id: connectionId, organizationId },
    select: { id: true, isDefault: true },
  });
  if (!target) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  if (target.isDefault) {
    const count = await prisma.ksefConnection.count({ where: { organizationId } });
    if (count <= 1) {
      return NextResponse.json({ ok: false, error: 'Nie mozna usunac jedynego domyslnego polaczenia.' }, { status: 400 });
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.ksefConnection.delete({ where: { id: connectionId } });
    if (target.isDefault) {
      const fallback = await tx.ksefConnection.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'asc' },
      });
      if (fallback) {
        await tx.ksefConnection.update({ where: { id: fallback.id }, data: { isDefault: true } });
      }
    }
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const organizationId = (session.user as any).organizationId as string;
  const { connectionId } = await params;
  try {
    const body = patchSchema.parse(await req.json());
    const exists = await prisma.ksefConnection.findFirst({
      where: { id: connectionId, organizationId },
      select: { id: true },
    });
    if (!exists) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    const updated = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.ksefConnection.updateMany({
          where: { organizationId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.ksefConnection.update({
        where: { id: connectionId },
        data: {
          ...(typeof body.label === 'string' ? { label: body.label } : {}),
          ...(typeof body.isDefault === 'boolean' ? { isDefault: body.isDefault } : {}),
        },
        select: { id: true, label: true, taxId: true, tokenMasked: true, isDefault: true, lastUsedAt: true },
      });
    });
    return NextResponse.json({ ok: true, connection: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Invalid payload' },
      { status: 400 }
    );
  }
}
