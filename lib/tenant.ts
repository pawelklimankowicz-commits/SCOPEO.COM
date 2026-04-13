import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
export async function requireTenantMembership() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const organizationId = (session.user as any).organizationId as string | undefined;
  if (!organizationId) redirect('/login');
  const membership = await prisma.membership.findFirst({ where: { userId: session.user.id as string, organizationId }, include: { organization: true } });
  if (!membership) redirect('/login');
  return { session, membership, organizationId };
}