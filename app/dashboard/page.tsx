import Link from 'next/link';
import { requireTenantMembership } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { signOut } from '@/lib/auth';
import DashboardActionsV9 from '@/components/DashboardActionsV9';
import ReviewPanel from '@/components/ReviewPanel';

async function logoutAction() {
  'use server';
  await signOut({ redirectTo: '/login' });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; year?: string }>;
}) {
  const { session, organizationId, membership } = await requireTenantMembership();
  const invoicePageSize = 50;
  const params = searchParams ? await searchParams : undefined;
  const pageParam = Number(params?.page ?? '1');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const yearParam = Number(params?.year ?? '');
  const selectedYear = Number.isFinite(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : undefined;
  const skip = (page - 1) * invoicePageSize;
  const profile = await prisma.carbonProfile.findUnique({ where: { organizationId } });
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  const issueDateFilter = selectedYear
    ? {
        gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
        lt: new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`),
      }
    : undefined;
  const invoicesTotal = await prisma.invoice.count({
    where: { organizationId, ...(issueDateFilter ? { issueDate: issueDateFilter } : {}) },
  });
  const invoices = await prisma.invoice.findMany({
    where: { organizationId, ...(issueDateFilter ? { issueDate: issueDateFilter } : {}) },
    include: {
      supplier: true,
      lines: {
        include: {
          emissionFactor: { include: { emissionSource: true } },
          mappingDecision: true,
        },
      },
    },
    orderBy: { issueDate: 'desc' },
    skip,
    take: invoicePageSize,
  });
  const lines = invoices.flatMap((i) => i.lines);
  const totalPages = Math.max(1, Math.ceil(invoicesTotal / invoicePageSize));
  const factors = await prisma.emissionFactor.findMany({
    where: { organizationId },
    include: { emissionSource: true },
    orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }],
  });
  const sources = await prisma.emissionSource.findMany({
    where: { organizationId },
    orderBy: { code: 'asc' },
  });
  const importRuns = await prisma.factorImportRun.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const history = await prisma.reviewEvent.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const latestCalculation = await prisma.emissionCalculation.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  const email = (session.user as { email?: string | null }).email;
  const role = (session.user as { role?: string | null }).role;

  return (
    <main className="container app-page">
      <div className="nav">
        <div>
          <span className="badge">{membership.organization.slug}</span>
          <h1 className="title" style={{ marginBottom: 8 }}>
            Panel — emisje i review
          </h1>
          <p className="subtitle app-intro" style={{ marginBottom: 0 }}>
            Zalogowany: <strong style={{ color: '#e8edff' }}>{email}</strong> · rola:{' '}
            <strong style={{ color: '#e8edff' }}>{role}</strong> · region:{' '}
            {org?.regionCode || 'PL'}. Poniżej: import faktur KSeF (XML), import faktorów (UK / EPA /
            overlay PL), kalkulacja kg CO₂e oraz kolejka review z historią zmian.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn btn-secondary" href="/onboarding">
            Onboarding
          </Link>
          <form action={logoutAction}>
            <button className="btn btn-secondary" type="submit">
              Wyloguj
            </button>
          </form>
        </div>
      </div>

      {!profile ? (
        <div className="empty-hint" style={{ marginBottom: 24 }}>
          <strong>Profil nie jest uzupełniony.</strong> Wejdź w Onboarding i zapisz token KSeF oraz dane
          organizacji — wtedy importy będą spójne z raportem.
        </div>
      ) : null}

      <div className="grid grid-3">
        <div className="kpi">
          <div className="small">Profil emisji</div>
          <h3 style={{ margin: '8px 0 0', color: '#f2f6ff' }}>{profile ? 'Skonfigurowany' : 'Brak'}</h3>
        </div>
        <div className="kpi">
          <div className="small">Importy faktorów (XLSX)</div>
          <h3 style={{ margin: '8px 0 0', color: '#f2f6ff' }}>{importRuns.length}</h3>
        </div>
        <div className="kpi">
          <div className="small">Zdarzenia review</div>
          <h3 style={{ margin: '8px 0 0', color: '#f2f6ff' }}>{history.length}</h3>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <p className="app-muted" style={{ marginBottom: 12, fontSize: 14 }}>
          <strong style={{ color: '#dce6ff' }}>Akcje:</strong> najpierw opcjonalnie „Importuj faktory
          zewnętrzne” (wymaga sieci), potem wklej XML FA i „Importuj XML”, na końcu „Przelicz emisje”.
        </p>
        <DashboardActionsV9 />
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <Link className="btn btn-secondary" href={`/api/emissions/export?format=csv${selectedYear ? `&year=${selectedYear}` : ''}`}>
            Eksport CSV
          </Link>
          <Link className="btn btn-secondary" href={`/api/emissions/export?format=xlsx${selectedYear ? `&year=${selectedYear}` : ''}`}>
            Eksport Excel
          </Link>
          <Link className="btn btn-secondary" href={`/api/emissions/export?format=pdf${selectedYear ? `&year=${selectedYear}` : ''}`}>
            Eksport PDF
          </Link>
        </div>
      </div>

      <div className="card section" style={{ marginTop: 28 }}>
        <h2>Źródła i wersje faktorów</h2>
        <p className="app-muted" style={{ marginTop: 0, fontSize: 14 }}>
          Rekordy powstają po udanym imporcie workbooków (UK Government, EPA) oraz overlayu PL.
        </p>
        {sources.length === 0 ? (
          <p className="empty-hint">Brak źródeł — uruchom import faktorów w sekcji akcji powyżej.</p>
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

      <div className="card section" style={{ marginTop: 24 }}>
        <h2>Historia importów XLSX</h2>
        <p className="app-muted" style={{ marginTop: 0, fontSize: 14 }}>
          Status VALIDATED / IMPORTED / FAILED oraz komunikaty walidacji parserów.
        </p>
        {importRuns.length === 0 ? (
          <p className="empty-hint">Brak importów — wykonaj pierwszy import faktorów z panelu akcji.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Źródło</th>
                <th>Status</th>
                <th>Zaimportowano</th>
                <th>Błędy / walidacja</th>
              </tr>
            </thead>
            <tbody>
              {importRuns.map((r) => (
                <tr key={r.id}>
                  <td>{r.sourceCode}</td>
                  <td>{r.status}</td>
                  <td>{r.importedCount}</td>
                  <td>
                    <div className="small" style={{ maxWidth: 520, whiteSpace: 'pre-wrap' }}>
                      {r.errorMessage ||
                        (typeof r.validationJson === 'string'
                          ? r.validationJson
                          : JSON.stringify(r.validationJson, null, 2))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ReviewPanel lines={lines} factors={factors} history={history} />
      <p className="app-muted" style={{ marginTop: 10, fontSize: 13 }}>
        Pokazano {invoices.length} z {invoicesTotal} faktur (limit {invoicePageSize} na widok).
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <Link className="btn btn-secondary" href={`/dashboard?page=1${selectedYear ? `&year=${selectedYear}` : ''}`}>
          Rok: {selectedYear ?? 'wszystkie'}
        </Link>
        {profile?.reportingYear ? (
          <Link className="btn btn-secondary" href={`/dashboard?page=1&year=${profile.reportingYear}`}>
            Filtruj: {profile.reportingYear}
          </Link>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <Link
          className="btn btn-secondary"
          href={`/dashboard?page=${Math.max(1, page - 1)}${selectedYear ? `&year=${selectedYear}` : ''}`}
          aria-disabled={page <= 1}
        >
          Poprzednia strona
        </Link>
        <Link
          className="btn btn-secondary"
          href={`/dashboard?page=${Math.min(totalPages, page + 1)}${selectedYear ? `&year=${selectedYear}` : ''}`}
          aria-disabled={page >= totalPages}
        >
          Następna strona
        </Link>
      </div>

      <div className="card section" style={{ marginTop: 24 }}>
        <h2>Ostatnia kalkulacja emisji</h2>
        <p className="app-muted" style={{ marginTop: 0, fontSize: 14 }}>
          Podsumowanie JSON (scope 1–3, kategorie) po kliknięciu „Przelicz emisje”.
        </p>
        {latestCalculation ? (
          <pre className="code">{JSON.stringify(latestCalculation.summaryJson, null, 2)}</pre>
        ) : (
          <p className="empty-hint">Brak kalkulacji — zaimportuj linie faktur i uruchom przeliczenie.</p>
        )}
      </div>
    </main>
  );
}
