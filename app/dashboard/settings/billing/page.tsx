import BillingPlansClient from '@/components/BillingPlansClient';
import { checkKsefLimit, checkUserLimit, getOrCreateStripeCustomer, getSubscription } from '@/lib/billing';
import { getTenantRlsContext, runWithTenantRls } from '@/lib/tenant';

export default async function BillingSettingsPage() {
  const t = await getTenantRlsContext();
  return runWithTenantRls({ userId: t.userId, organizationId: t.organizationId }, async () => {
  const { organizationId } = t;
  await getOrCreateStripeCustomer(organizationId);
  const [subscription, userUsage, ksefUsage] = await Promise.all([
    getSubscription(organizationId),
    checkUserLimit(organizationId),
    checkKsefLimit(organizationId),
  ]);

  return (
    <div className="container app-page">
      <h1 className="title">Billing</h1>
      <p className="app-muted" style={{ marginTop: 0 }}>
        Zarzadzaj planem subskrypcji, limitami KSeF i liczba uzytkownikow.
      </p>
      <BillingPlansClient
        snapshot={{
          plan: subscription?.plan ?? 'MIKRO',
          status: subscription?.status ?? 'TRIALING',
          trialEndsAt: subscription?.trialEndsAt?.toISOString() ?? null,
          currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
          usedUsers: userUsage.used,
          userLimit: userUsage.limit,
          usedKsefConnections: ksefUsage.used,
          ksefLimit: ksefUsage.limit,
        }}
      />
    </div>
  );
  });
}
