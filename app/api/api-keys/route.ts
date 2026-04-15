import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { generateApiKey } from '@/lib/api-keys';
import { canAccessApi } from '@/lib/billing-features';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  name: z.string().min(2),
  scopes: z.array(z.enum(['emissions:read', 'suppliers:read', 'factors:read'])).min(1),
  expiresAt: z.string().datetime().optional(),
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
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { plan: true },
  });
  if (!canAccessApi(subscription?.plan ?? 'MIKRO')) {
    return NextResponse.json({ ok: false, error: 'Upgrade planu wymagany' }, { status: 403 });
  }
  const keys = await prisma.apiKey.findMany({
    where: { organizationId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ ok: true, keys });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const organizationId = (session.user as any).organizationId as string;
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { plan: true },
  });
  if (!canAccessApi(subscription?.plan ?? 'MIKRO')) {
    return NextResponse.json({ ok: false, error: 'Upgrade planu wymagany' }, { status: 403 });
  }
  try {
    const body = createSchema.parse(await req.json());
    const generated = generateApiKey();
    const created = await prisma.apiKey.create({
      data: {
        organizationId,
        name: body.name,
        keyHash: generated.hash,
        keyPrefix: generated.prefix,
        scopes: body.scopes,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ ok: true, key: created, rawKey: generated.raw });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Invalid payload' },
      { status: 400 }
    );
  }
}
