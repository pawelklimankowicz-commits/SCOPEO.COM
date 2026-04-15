import ReviewPanel from '@/components/ReviewPanel';
import { prisma } from '@/lib/prisma';
import { requireTenantMembership } from '@/lib/tenant';

export default async function DashboardReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const { organizationId } = await requireTenantMembership();
  const params = searchParams ? await searchParams : undefined;
  const yearParam = Number(params?.year ?? '');
  const selectedYear = Number.isFinite(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : undefined;

  const issueDateFilter = selectedYear
    ? {
        gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
        lt: new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`),
      }
    : undefined;

  const [invoices, history] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId, ...(issueDateFilter ? { issueDate: issueDateFilter } : {}) },
      include: {
        lines: {
          include: {
            emissionFactor: { include: { emissionSource: true } },
            mappingDecision: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
      take: 50,
    }),
    prisma.reviewEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const lines = invoices.flatMap((invoice) => invoice.lines);
  const lineCategoryCodes = [...new Set(lines.map((l) => l.overrideCategoryCode ?? l.categoryCode).filter(Boolean))];
  const factorCount = await prisma.emissionFactor.count({ where: { organizationId } });
  const factors = await prisma.emissionFactor.findMany({
    where: {
      organizationId,
      ...(lineCategoryCodes.length > 0 ? { categoryCode: { in: lineCategoryCodes } } : {}),
    },
    include: { emissionSource: true },
    orderBy: [{ regionPriority: 'asc' }, { year: 'desc' }],
    take: 200,
  });

  return (
    <div className="container app-page">
      <h1 className="title">Panel review</h1>
      {factorCount > factors.length ? (
        <p className="app-muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
          Lista faktorów w polu „Override” jest skrócona: załadowano {factors.length} rekordów
          {lineCategoryCodes.length > 0 ? ' (kategorie z linii do review)' : ' (pierwsze wg priorytetu regionu)'},
          w bazie jest <strong style={{ color: '#dce6ff' }}>{factorCount}</strong> łącznie.
        </p>
      ) : null}
      <ReviewPanel lines={lines} factors={factors} history={history} />
    </div>
  );
}
