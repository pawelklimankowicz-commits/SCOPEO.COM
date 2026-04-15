import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireTenantMembership } from '@/lib/tenant';

function parsePagination(searchParams?: { page?: string; year?: string; supplier?: string }) {
  const invoicePageSize = 50;
  const pageParam = Number(searchParams?.page ?? '1');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const yearParam = Number(searchParams?.year ?? '');
  const selectedYear =
    Number.isFinite(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : undefined;
  const skip = (page - 1) * invoicePageSize;

  const supplierId =
    typeof searchParams?.supplier === 'string' && searchParams.supplier.trim().length > 0
      ? searchParams.supplier.trim()
      : undefined;

  return { page, selectedYear, skip, invoicePageSize, supplierId };
}

export default async function DashboardInvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; year?: string; supplier?: string }>;
}) {
  const { organizationId } = await requireTenantMembership();
  const params = searchParams ? await searchParams : undefined;
  const { page, selectedYear, skip, invoicePageSize, supplierId } = parsePagination(params);

  const issueDateFilter = selectedYear
    ? {
        gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
        lt: new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`),
      }
    : undefined;

  const [profile, invoicesTotal, invoices] = await Promise.all([
    prisma.carbonProfile.findUnique({ where: { organizationId } }),
    prisma.invoice.count({
      where: {
        organizationId,
        ...(issueDateFilter ? { issueDate: issueDateFilter } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        ...(issueDateFilter ? { issueDate: issueDateFilter } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
      include: { supplier: true, _count: { select: { lines: true } } },
      orderBy: { issueDate: 'desc' },
      skip,
      take: invoicePageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(invoicesTotal / invoicePageSize));

  return (
    <div className="container app-page">
      <h1 className="title">Faktury</h1>
      <p className="app-muted" style={{ marginTop: 0, fontSize: 14 }}>
        Pokazano {invoices.length} z {invoicesTotal} faktur (limit {invoicePageSize} na widok).
      </p>
      {supplierId ? (
        <p className="app-muted" style={{ marginTop: 0, fontSize: 13 }}>
          Aktywny filtr dostawcy.{' '}
          <Link className="btn btn-secondary" href={`/dashboard/invoices?page=1${selectedYear ? `&year=${selectedYear}` : ''}`}>
            Wyczyść filtr
          </Link>
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: 10, marginTop: 10, marginBottom: 12 }}>
        <Link className="btn btn-secondary" href={`/dashboard/invoices?page=1${selectedYear ? `&year=${selectedYear}` : ''}`}>
          Rok: {selectedYear ?? 'wszystkie'}
        </Link>
        {profile?.reportingYear ? (
          <Link className="btn btn-secondary" href={`/dashboard/invoices?page=1&year=${profile.reportingYear}`}>
            Filtruj: {profile.reportingYear}
          </Link>
        ) : null}
      </div>

      {invoices.length === 0 ? (
        <p className="empty-hint">Brak faktur dla wybranego zakresu.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Numer</th>
              <th>Dostawca</th>
              <th>Data</th>
              <th>Wartość netto</th>
              <th>Liczba linii</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.number}</td>
                <td>
                  {invoice.supplier ? (
                    <Link href={`/dashboard/invoices?page=1&supplier=${invoice.supplier.id}${selectedYear ? `&year=${selectedYear}` : ''}`}>
                      {invoice.supplier.name}
                    </Link>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{invoice.issueDate.toISOString().slice(0, 10)}</td>
                <td>{invoice.netTotal.toFixed(2)}</td>
                <td>{invoice._count.lines}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {page <= 1 ? (
          <span className="btn btn-secondary" aria-disabled="true" style={{ opacity: 0.55, cursor: 'not-allowed' }}>
            Poprzednia strona
          </span>
        ) : (
          <Link
            className="btn btn-secondary"
            href={`/dashboard/invoices?page=${Math.max(1, page - 1)}${selectedYear ? `&year=${selectedYear}` : ''}${supplierId ? `&supplier=${supplierId}` : ''}`}
          >
            Poprzednia strona
          </Link>
        )}

        {page >= totalPages ? (
          <span className="btn btn-secondary" aria-disabled="true" style={{ opacity: 0.55, cursor: 'not-allowed' }}>
            Następna strona
          </span>
        ) : (
          <Link
            className="btn btn-secondary"
            href={`/dashboard/invoices?page=${Math.min(totalPages, page + 1)}${selectedYear ? `&year=${selectedYear}` : ''}${supplierId ? `&supplier=${supplierId}` : ''}`}
          >
            Następna strona
          </Link>
        )}
      </div>
    </div>
  );
}
