import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const { jobId } = await context.params;
  const job = await prisma.ksefImportJob.findFirst({
    where: { id: jobId, organizationId },
  });
  if (!job) return NextResponse.json({ ok: false, error: 'Job not found' }, { status: 404 });
  return NextResponse.json({ ok: true, job });
}
