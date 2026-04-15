import type { Prisma } from '@prisma/client';

export const EVENT_LABELS: Record<string, string> = {
  LEAD_CAPTURED: 'Lead pozyskany',
  KSEF_INVOICE_IMPORTED: 'Faktura KSeF zaimportowana',
  KSEF_IMPORT_FAILED: 'Import KSeF nieudany',
  REVIEW_STATUS_CHANGED: 'Status recenzji zmieniony',
  GDPR_ACCESS_REQUEST: 'Wniosek RODO (dostep)',
  GDPR_ERASURE_EXECUTED: 'Wniosek RODO (usuniecie)',
  FACTOR_IMPORT_DONE: 'Import faktorow emisji',
  MEMBER_JOINED: 'Nowy czlonek organizacji',
  MEMBER_ROLE_CHANGED: 'Rola czlonka zmieniona',
  GDPR_REQUEST_CREATED: 'Wniosek GDPR utworzony',
};

export function canAccessAudit(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export function buildAuditWhere(input: {
  organizationId: string;
  from?: string | null;
  to?: string | null;
  eventType?: string | null;
  search?: string | null;
}): Prisma.ProcessingRecordWhereInput {
  const where: Prisma.ProcessingRecordWhereInput = { organizationId: input.organizationId };
  const from = input.from ? new Date(input.from) : null;
  const to = input.to ? new Date(input.to) : null;
  if (from || to) {
    where.createdAt = {
      ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
      ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
    };
  }
  if (input.eventType) {
    const values = input.eventType
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (values.length > 0) where.eventType = { in: values };
  }
  if (input.search && input.search.trim()) {
    where.subjectRef = { contains: input.search.trim(), mode: 'insensitive' };
  }
  return where;
}

export function toAuditCsv(
  rows: Array<{
    createdAt: Date;
    eventType: string;
    subjectRef: string | null;
    legalBasis: string | null;
    payload: unknown;
  }>
) {
  const escape = (value: string) => {
    if (value.includes('"') || value.includes(',') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const header = ['Data i godzina', 'Zdarzenie', 'Podmiot', 'Podstawa prawna', 'Szczegoly JSON'];
  const lines = rows.map((row) => [
    row.createdAt.toISOString(),
    EVENT_LABELS[row.eventType] ?? row.eventType,
    row.subjectRef ?? '',
    row.legalBasis ?? '',
    JSON.stringify(row.payload ?? {}),
  ]);
  return [header, ...lines].map((line) => line.map((cell) => escape(String(cell))).join(',')).join('\n');
}
