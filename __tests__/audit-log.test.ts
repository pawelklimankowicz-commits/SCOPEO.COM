import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    processingRecord: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { GET } from '@/app/api/audit-log/route';
import { buildAuditWhere } from '@/lib/audit-log';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('audit log api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const req = new NextRequest('http://localhost/api/audit-log');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for ANALYST role', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'u1', organizationId: 'org1', role: 'ANALYST' },
    } as any);
    const req = new NextRequest('http://localhost/api/audit-log');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('builds from/to filters correctly', () => {
    const where = buildAuditWhere({
      organizationId: 'org1',
      from: '2025-01-01',
      to: '2025-01-31',
    });
    expect(where.organizationId).toBe('org1');
    expect((where.createdAt as any).gte).toBeInstanceOf(Date);
    expect((where.createdAt as any).lte).toBeInstanceOf(Date);
  });

  it('returns data for admin with filters', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'u1', organizationId: 'org1', role: 'ADMIN' },
    } as any);
    vi.mocked(prisma.processingRecord.findMany).mockResolvedValueOnce([
      {
        id: 'r1',
        createdAt: new Date('2025-01-15T10:00:00.000Z'),
        eventType: 'FACTOR_IMPORT_DONE',
        subjectRef: 'external_factors',
        legalBasis: 'art. 6',
        payload: {},
      },
    ] as any);
    vi.mocked(prisma.processingRecord.count).mockResolvedValueOnce(1 as any);

    const req = new NextRequest('http://localhost/api/audit-log?from=2025-01-01&to=2025-01-31&search=factor');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.total).toBe(1);
  });
});
