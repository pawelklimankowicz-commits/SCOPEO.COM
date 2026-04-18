import Link from 'next/link';
import { EmissionsCharts } from '@/components/EmissionsCharts';
import { ReportPdfTotalsPreference } from '@/components/ReportPdfTotalsPreference';
import { prisma } from '@/lib/prisma';
import { requireTenantMembership } from '@/lib/tenant';

export default async function DashboardReportPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const { organizationId, session } = await requireTenantMembership();
  const role = (session.user as { role?: string }).role;
  const canEdit = role === 'OWNER' || role === 'ADMIN';
  const params = searchParams ? await searchParams : undefined;
  const yearParam = Number(params?.year ?? '');
  const selectedYear = Number.isFinite(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : undefined;

  const issueDateFilter = selectedYear
    ? {
        gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
        lt: new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`),
      }
    : undefined;

  const [profile, invoices, importRuns] = await Promise.all([
    prisma.carbonProfile.findUnique({ where: { organizationId } }),
    prisma.invoice.findMany({
      where: { organizationId, ...(issueDateFilter ? { issueDate: issueDateFilter } : {}) },
      include: {
        lines: {
          include: {
            emissionFactor: { include: { emissionSource: true } },
          },
        },
      },
      orderBy: { issueDate: 'desc' },
      take: 200,
    }),
    prisma.factorImportRun.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const lines = invoices.flatMap((i) => i.lines);
  const emissionMap = new Map<string, { categoryCode: string; scope: string; totalCo2eKg: number }>();
  for (const line of lines) {
    const categoryCode = line.overrideCategoryCode ?? line.categoryCode;
    const factorValue = line.emissionFactor?.factorValue ?? 0;
    const co2eKg =
      line.calculationMethod === 'ACTIVITY' ? (line.activityValue ?? 0) * factorValue : line.netValue * factorValue;
    const scopeLabel = line.scope === 'SCOPE1' ? 'Scope 1' : line.scope === 'SCOPE2' ? 'Scope 2' : 'Scope 3';
    const key = `${scopeLabel}:${categoryCode}`;
    const existing = emissionMap.get(key);
    if (existing) {
      existing.totalCo2eKg += co2eKg;
    } else {
      emissionMap.set(key, { categoryCode, scope: scopeLabel, totalCo2eKg: co2eKg });
    }
  }
  const emissions = Array.from(emissionMap.values());

  return (
    <div className="container app-page">
      <h1 className="title">Raport emisji</h1>
      <p className="app-muted" style={{ marginTop: 0, fontSize: 14 }}>
        Wykresy i eksporty emisji CO2e dla zaimportowanych linii faktur.
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <Link className="btn btn-secondary" href={`/api/emissions/export?format=csv${selectedYear ? `&year=${selectedYear}` : ''}`}>
          Eksport CSV
        </Link>
        <Link className="btn btn-secondary" href={`/api/emissions/export?format=xlsx${selectedYear ? `&year=${selectedYear}` : ''}`}>
          Eksport Excel
        </Link>
        <Link className="btn btn-secondary" href={`/api/emissions/export?format=pdf${selectedYear ? `&year=${selectedYear}` : ''}`}>
          Eksport PDF
        </Link>
        <Link className="btn btn-secondary" href={`/api/emissions/report${selectedYear ? `?year=${selectedYear}` : ''}`}>
          Pobierz raport GHG (PDF)
        </Link>
        <Link className="btn btn-secondary" href={`/api/emissions/csrd-export?year=${selectedYear ?? profile?.reportingYear ?? new Date().getFullYear()}&format=json`}>
          Pobierz CSRD JSON
        </Link>
        <Link className="btn btn-secondary" href={`/api/emissions/csrd-export?year=${selectedYear ?? profile?.reportingYear ?? new Date().getFullYear()}&format=csv`}>
          Pobierz CSRD CSV
        </Link>
        <Link className="btn btn-secondary" href={`/api/emissions/csrd-export/xml?year=${selectedYear ?? profile?.reportingYear ?? new Date().getFullYear()}`}>
          Pobierz ESRS XML
        </Link>
        {profile?.reportingYear ? (
          <Link className="btn btn-secondary" href={`/dashboard/report?year=${profile.reportingYear}`}>
            Filtruj: {profile.reportingYear}
          </Link>
        ) : null}
      </div>

      {profile ? (
        <ReportPdfTotalsPreference
          initialBasis={profile.reportTotalDisplayBasis}
          canEdit={canEdit}
          yearQuery={selectedYear ? String(selectedYear) : ''}
          snapshotMinQualityScore={profile.snapshotMinQualityScore}
          snapshotMinScope3CoveragePct={profile.snapshotMinScope3CoveragePct}
          auditRiskMissingPctHigh={profile.auditRiskMissingPctHigh}
        />
      ) : null}

      <EmissionsCharts data={emissions} />

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
                        (typeof r.validationJson === 'string' ? r.validationJson : JSON.stringify(r.validationJson, null, 2))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
