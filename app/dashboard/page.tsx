import Link from 'next/link';
import DashboardActionsV9 from '@/components/DashboardActionsV9';
import { prisma } from '@/lib/prisma';
import { getTenantRlsContext, runWithTenantRls } from '@/lib/tenant';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; year?: string }>;
}) {
  const t = await getTenantRlsContext();
  return runWithTenantRls({ userId: t.userId, organizationId: t.organizationId }, async () => {
  const { session, organizationId, membership } = t;
  const params = searchParams ? await searchParams : undefined;
  const yearParam = Number(params?.year ?? '');
  const selectedYear = Number.isFinite(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : undefined;
  const [profile, factorCount, importRuns, history, latestCalculation] = await Promise.all([
    prisma.carbonProfile.findUnique({ where: { organizationId } }),
    prisma.emissionFactor.count({ where: { organizationId } }),
    prisma.factorImportRun.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.reviewEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.emissionCalculation.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="container app-page">
      <div>
        <span className="badge">{membership.organization.slug}</span>
        <h1 className="title" style={{ marginBottom: 8 }}>
          Przeglad dashboardu
        </h1>
      </div>
      {!(session.user as any).emailVerified && (
        <div
          style={{
            background: '#fef9c3',
            border: '1px solid #fde68a',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            color: '#78350f',
          }}
        >
          ⚠️ Adres email nie jest potwierdzony.{' '}
          <Link href="/api/auth/resend-verification" prefetch={false} style={{ color: '#92400e', fontWeight: 600 }}>
            Wyślij ponownie
          </Link>
        </div>
      )}

      <div className="grid grid-4">
        <div className="kpi">
          <div className="small">Profil emisji</div>
          <h3 style={{ margin: '8px 0 0', color: '#f2f6ff' }}>{profile ? 'Skonfigurowany' : 'Brak'}</h3>
        </div>
        <div className="kpi">
          <div className="small">Rekordy faktorów (DB)</div>
          <h3 style={{ margin: '8px 0 0', color: '#f2f6ff' }}>{factorCount}</h3>
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
          <Link
            className="btn btn-secondary"
            href={`/api/emissions/export?format=csv${selectedYear ? `&year=${selectedYear}` : ''}`}
          >
            Eksport CSV
          </Link>
          <Link
            className="btn btn-secondary"
            href={`/api/emissions/export?format=xlsx${selectedYear ? `&year=${selectedYear}` : ''}`}
          >
            Eksport Excel
          </Link>
          <Link
            className="btn btn-secondary"
            href={`/api/emissions/export?format=pdf${selectedYear ? `&year=${selectedYear}` : ''}`}
          >
            Eksport PDF
          </Link>
          <Link
            className="btn btn-secondary"
            href={`/api/emissions/report${selectedYear ? `?year=${selectedYear}` : ''}`}
          >
            Pobierz raport GHG (PDF)
          </Link>
        </div>
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
    </div>
  );
  });
}
