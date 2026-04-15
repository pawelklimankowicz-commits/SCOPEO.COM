import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!['OWNER', 'ADMIN', 'ANALYST', 'APPROVER'].includes(String(role || ''))) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId = (session.user as any).organizationId as string;
  const { supplierId } = await params;
  const hints = await prisma.supplierCategoryHint.findMany({
    where: { organizationId, supplierId },
    orderBy: [{ sampleCount: 'desc' }, { updatedAt: 'desc' }],
  });
  return NextResponse.json({ ok: true, hints });
}
