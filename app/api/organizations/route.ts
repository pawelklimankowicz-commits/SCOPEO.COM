import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json({
    ok: true,
    organizations: memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
    })),
    activeOrganizationId:
      ((session as any).activeOrganizationId as string | undefined) ??
      ((session as any).organizationId as string | undefined) ??
      (session.user as any).organizationId ??
      null,
  });
}
