import GdprRequestsPanel from '@/components/GdprRequestsPanel';
import { requireTenantMembership } from '@/lib/tenant';

export default async function DashboardGdprPage() {
  const { session } = await requireTenantMembership();
  const role = (session.user as { role?: string | null }).role;
  const canManage = role === 'OWNER' || role === 'ADMIN';

  return (
    <div className="container app-page">
      <h1 className="title">Wnioski GDPR</h1>
      {!canManage ? (
        <p className="empty-hint">Ta sekcja jest dostępna tylko dla ról OWNER i ADMIN.</p>
      ) : null}
      <GdprRequestsPanel canManage={canManage} />
    </div>
  );
}
