import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { requireKsefCapacity } from '@/lib/billing-guard';
import { encryptKsefToken } from '@/lib/ksef-token-crypto';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  label: z.string().min(2),
  taxId: z.string().min(10),
  token: z.string().min(8),
});

function canManage(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const organizationId = (session.user as any).organizationId as string;
  const items = await prisma.ksefConnection.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      label: true,
      taxId: true,
      tokenMasked: true,
      isDefault: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ ok: true, connections: items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const organizationId = (session.user as any).organizationId as string;
  try {
    const body = createSchema.parse(await req.json());
    await requireKsefCapacity(organizationId);
    const existingCount = await prisma.ksefConnection.count({ where: { organizationId } });
    const created = await prisma.ksefConnection.create({
      data: {
        organizationId,
        label: body.label,
        taxId: body.taxId.replace(/\D/g, ''),
        tokenEncrypted: encryptKsefToken(body.token),
        tokenMasked: `${body.token.slice(0, 4)}...${body.token.slice(-4)}`,
        isDefault: existingCount === 0,
      },
      select: { id: true, label: true, taxId: true, tokenMasked: true, isDefault: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, connection: created });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Invalid payload' },
      { status: 400 }
    );
  }
}
