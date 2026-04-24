import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runWithTenantRls } from '@/lib/tenant-rls-context';

function isManager(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Zdarzenia lejka dla aktywnej organizacji (tylko APP). OWNER/ADMIN.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isManager((session.user as { role?: string }).role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId =
    (session as { activeOrganizationId?: string }).activeOrganizationId ||
    (session as { organizationId?: string }).organizationId ||
    (session.user as { organizationId?: string }).organizationId;
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id as string;

  const { searchParams } = new URL(req.url);
  const days = Math.min(30, Math.max(1, Number(searchParams.get('days') || 14) || 14));
  const since = new Date();
  since.setDate(since.getDate() - days);
  try {
    const [groupApp, recent] = await runWithTenantRls(
      { userId, organizationId },
      async () => {
        const [ga, r] = await Promise.all([
          prisma.journeyEvent.groupBy({
            by: ['name'],
            where: {
              organizationId,
              source: 'APP',
              createdAt: { gte: since },
            },
            _count: { _all: true },
          }),
          prisma.journeyEvent.findMany({
            where: {
              organizationId,
              source: 'APP',
              createdAt: { gte: since },
            },
            orderBy: { createdAt: 'desc' },
            take: 150,
            select: {
              id: true,
              name: true,
              path: true,
              userId: true,
              createdAt: true,
              properties: true,
            },
          }),
        ]);
        return [ga, r] as const;
      }
    );

    const byName = [...groupApp]
      .map((g) => ({ name: g.name, count: g._count._all }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      ok: true,
      days,
      byName,
      marketingInOrgNote:
        'Kliknięcia CTA (marketing) zapisują się bez przypięcia do organizacji. Żeby zobaczyć lejek globalny, użyj Eksportu bazy (Metabase, SQL) po tabeli JourneyEvent, organizationId = NULL i source = MARKETING.',
      recent: recent.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error' },
      { status: 500 }
    );
  }
}
