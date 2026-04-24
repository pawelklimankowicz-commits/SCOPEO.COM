import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTenantRlsContext, runWithTenantRls } from '@/lib/tenant';
import AnalyticsSettingsClient from '@/components/AnalyticsSettingsClient';

export default async function OrganizationAnalyticsPage() {
  const t = await getTenantRlsContext();
  return runWithTenantRls(
    { userId: t.userId, organizationId: t.organizationId },
    async () => {
      const role = (t.session.user as { role?: string }).role;
      if (role !== 'OWNER' && role !== 'ADMIN') {
        notFound();
      }
      return (
        <div className="container app-page">
          <h1 className="title">Analityka produktu (lejek)</h1>
          <p className="subtitle app-muted" style={{ marginTop: 0, marginBottom: 16 }}>
            <Link href="/dashboard/settings" className="app-muted" style={{ textDecoration: 'underline' }}>
              Ustawienia
            </Link>
            {' / '}
            <span>Lejek w organizacji</span>
          </p>
          <AnalyticsSettingsClient />
        </div>
      );
    }
  );
}
