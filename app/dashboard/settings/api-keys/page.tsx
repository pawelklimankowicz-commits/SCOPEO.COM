import ApiKeysClient from '@/components/ApiKeysClient';
import { canAccessApi } from '@/lib/billing-features';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getTenantRlsContext, runWithTenantRls } from '@/lib/tenant';

export default async function ApiKeysPage() {
  const t = await getTenantRlsContext();
  return runWithTenantRls({ userId: t.userId, organizationId: t.organizationId }, async () => {
  const { session } = t;
  const role = (session.user as { role?: string })?.role as string | undefined;
  if (!['OWNER', 'ADMIN'].includes(String(role || ''))) redirect('/dashboard');
  const organizationId = t.organizationId;
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { plan: true },
  });
  if (!canAccessApi(subscription?.plan ?? 'MIKRO')) redirect('/dashboard/settings/billing');

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

  return (
    <div className="container app-page">
      <h1 className="title">Klucze API</h1>
      <p className="app-muted" style={{ marginTop: 0 }}>
        Tworz i zarzadzaj kluczami dla integracji ERP/BI.
      </p>
      <ApiKeysClient initialKeys={keys} />
    </div>
  );
  });
}
