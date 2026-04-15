import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  organizationId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, organizationId: body.organizationId },
      select: { organizationId: true, role: true },
    });
    if (!membership) {
      return NextResponse.json({ ok: false, error: 'Brak dostepu do tej organizacji' }, { status: 403 });
    }

    // Token update is done client-side via `useSession().update({ activeOrganizationId })`.
    return NextResponse.json({ ok: true, activeOrganizationId: membership.organizationId, role: membership.role });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Nieprawidlowe dane' },
      { status: 400 }
    );
  }
}
