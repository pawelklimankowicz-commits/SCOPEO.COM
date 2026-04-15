import { redirect } from 'next/navigation';
import AuditLogTable from '@/components/audit-log-table';
import { canAccessAudit } from '@/lib/audit-log';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string; eventType?: string; search?: string; cursor?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string | undefined;
  if (!canAccessAudit(role)) redirect('/dashboard');
  const organizationId = (session.user as any).organizationId as string;
  const params = searchParams ? await searchParams : {};
  const where: any = { organizationId };
  if (params?.from || params?.to) {
    where.createdAt = {
      ...(params?.from ? { gte: new Date(params.from) } : {}),
      ...(params?.to ? { lte: new Date(params.to) } : {}),
    };
  }
  if (params?.eventType) {
    where.eventType = {
      in: params.eventType.split(',').map((value) => value.trim()).filter(Boolean),
    };
  }
  if (params?.search) {
    where.subjectRef = { contains: params.search, mode: 'insensitive' };
  }

  const records = await prisma.processingRecord.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    ...(params?.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    take: 26,
  });
  const rows = records.slice(0, 25);
  const nextCursor = records.length > 25 ? records[25]?.id ?? null : null;

  return (
    <div className="container app-page">
      <h1 className="title">Rejestr Przetwarzania Danych</h1>
      <form className="card section" method="GET" style={{ marginBottom: 16 }}>
        <div className="grid grid-2">
          <label>
            Od
            <input type="date" name="from" defaultValue={params?.from ?? ''} />
          </label>
          <label>
            Do
            <input type="date" name="to" defaultValue={params?.to ?? ''} />
          </label>
          <label>
            Typ zdarzenia (CSV)
            <input name="eventType" defaultValue={params?.eventType ?? ''} placeholder="FACTOR_IMPORT_DONE,GDPR_REQUEST_CREATED" />
          </label>
          <label>
            Szukaj subjectRef
            <input name="search" defaultValue={params?.search ?? ''} />
          </label>
        </div>
        <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }}>
          Filtruj
        </button>
      </form>
      <AuditLogTable
        rows={rows.map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          eventType: row.eventType,
          subjectRef: row.subjectRef,
          legalBasis: row.legalBasis,
          payload: row.payload,
        }))}
        nextCursor={nextCursor}
        filters={{
          from: params?.from,
          to: params?.to,
          eventType: params?.eventType,
          search: params?.search,
        }}
      />
    </div>
  );
}
