import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateCsrdReport, toEsrsXml } from '@/lib/csrd-export';

function canAccess(role?: string | null) {
  return ['ANALYST', 'APPROVER', 'OWNER', 'ADMIN'].includes(String(role || ''));
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!canAccess(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const organizationId = (session.user as any).organizationId as string;
  const year = Number(req.nextUrl.searchParams.get('year'));
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ ok: false, error: 'year is required' }, { status: 400 });
  }

  const report = await generateCsrdReport(organizationId, year);
  const xml = toEsrsXml(report);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="esrs-e1-${year}.xml"`,
    },
  });
}
