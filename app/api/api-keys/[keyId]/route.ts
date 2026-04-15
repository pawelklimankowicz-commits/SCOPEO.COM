import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function canManage(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const organizationId = (session.user as any).organizationId as string;
  const { keyId } = await params;

  const updated = await prisma.apiKey.updateMany({
    where: { id: keyId, organizationId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (updated.count === 0) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
