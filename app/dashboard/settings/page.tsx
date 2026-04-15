import Link from 'next/link';
import InvitesPanel from '@/components/InvitesPanel';
import { prisma } from '@/lib/prisma';
import { requireTenantMembership } from '@/lib/tenant';

export default async function DashboardSettingsPage() {
  const { session, organizationId } = await requireTenantMembership();
  const role = (session.user as { role?: string | null }).role;
  const canManageInvites = role === 'OWNER' || role === 'ADMIN';

  const [profile, factorCount, sources] = await Promise.all([
    prisma.carbonProfile.findUnique({ where: { organizationId } }),
    prisma.emissionFactor.count({ where: { organizationId } }),
    prisma.emissionSource.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
    }),
  ]);

  return (
    <div className="container app-page">
      <h1 className="title">Ustawienia</h1>

      {!profile ? (
        <div className="empty-hint" style={{ marginBottom: 16 }}>
          <strong>Profil nie jest uzupełniony.</strong> Wejdź w Onboarding i zapisz token KSeF oraz dane organizacji.
        </div>
      ) : null}

      <div className="card section">
        <h2>Profil organizacji</h2>
        <p className="app-muted" style={{ marginTop: 0 }}>
          Dane źródłowe do raportowania GHG i importów KSeF.
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <Link className="btn btn-secondary" href="/onboarding">
            Przejdź do onboardingu
          </Link>
          <Link className="btn btn-secondary" href="/dashboard/settings/billing">
            Billing i plan
          </Link>
          <Link className="btn btn-secondary" href="/dashboard/settings/api-keys">
            Klucze API
          </Link>
        </div>
        {profile ? (
          <table>
            <tbody>
              <tr>
                <th>Firma</th>
                <td>{profile.companyName}</td>
              </tr>
              <tr>
                <th>Branża</th>
                <td>{profile.industry}</td>
              </tr>
              <tr>
                <th>Rok raportowania</th>
                <td>{profile.reportingYear}</td>
              </tr>
              <tr>
                <th>Rok bazowy</th>
                <td>{profile.baseYear}</td>
              </tr>
              <tr>
                <th>Granica raportowania</th>
                <td>{profile.boundaryApproach}</td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="card section" style={{ marginTop: 24 }}>
        <h2>Źródła i wersje faktorów</h2>
        <p className="app-muted" style={{ marginTop: 0, fontSize: 14 }}>
          W bazie jest <strong style={{ color: '#e8edff' }}>{factorCount}</strong> rekordów faktorów emisji.
        </p>
        {sources.length === 0 ? (
          <p className="empty-hint">Brak źródeł — uruchom import faktorów z panelu akcji.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Kod</th>
                <th>Wydawca</th>
                <th>Wersja</th>
                <th>Region</th>
                <th>Notatka</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id}>
                  <td>{s.code}</td>
                  <td>{s.publisher}</td>
                  <td>{s.version}</td>
                  <td>{s.region ?? '-'}</td>
                  <td>{s.notes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InvitesPanel canManage={canManageInvites} />
    </div>
  );
}
