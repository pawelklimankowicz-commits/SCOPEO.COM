import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { importExternalFactors } from '@/lib/factor-import';
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const organizationId = (session.user as any).organizationId as string;
    const result = await importExternalFactors(organizationId, session.user.id as string);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}