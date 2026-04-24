import { cache } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { runWithRlsBypass, runWithTenantRls } from '@/lib/tenant-rls-context';

export { runWithRlsBypass, runWithTenantRls } from '@/lib/tenant-rls-context';

/** Prisma: członkostwo w kontekście RLS `bypass` (sesja jeszcze nie ma tenant GUC). */
async function loadMembershipWithBypass(organizationId: string, userId: string) {
  return runWithRlsBypass(() =>
    prisma.membership.findFirst({
      where: { userId, organizationId, status: 'ACTIVE' },
      include: { organization: true },
    })
  );
}

export type TenantRlsContext = {
  session: NonNullable<Awaited<ReturnType<typeof auth>>>;
  membership: NonNullable<Awaited<ReturnType<typeof loadMembershipWithBypass>>>;
  organizationId: string;
  userId: string;
};

/**
 * Pojedyncze wczytanie per żądanie w RSC (deduplikacja przez `cache` z React 19).
 * W komponentach dashboardu: `const t = await getTenantRlsContext(); return runWithTenantRls({ userId: t.userId, organizationId: t.organizationId }, async () => { ... })`.
 */
async function loadTenantRlsContextCore(): Promise<TenantRlsContext> {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const organizationId =
    ((session as { activeOrganizationId?: string }).activeOrganizationId as string | undefined) ||
    ((session as { organizationId?: string }).organizationId as string | undefined) ||
    ((session.user as { organizationId?: string }).organizationId as string | undefined);
  if (!organizationId) redirect('/login');
  const userId = session.user.id as string;
  const membership = await loadMembershipWithBypass(organizationId, userId);
  if (!membership) redirect('/login');
  return { session, membership, organizationId, userId };
}

export const getTenantRlsContext = cache(loadTenantRlsContextCore);

/**
 * Dla API route i kodu, który nie powinien używać `cache` (Route Handlers).
 * Wykonuje to samo co `getTenantRlsContext` bez cache.
 */
export async function requireTenantMembership(): Promise<TenantRlsContext> {
  return loadTenantRlsContextCore();
}
