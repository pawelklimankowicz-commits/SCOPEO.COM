import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeProcessingRecord } from '@/lib/privacy-register';

function canManage(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const role = (session.user as any).role as string | null | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { requestId } = await context.params;
  const request = await prisma.gdprRequest.findFirst({
    where: { id: requestId, organizationId },
  });
  if (!request) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 });
  if (request.status === 'COMPLETED') {
    return NextResponse.json({ ok: true, request });
  }

  let affectedUsers = 0;
  let affectedLeads = 0;
  const email = request.subjectEmail.toLowerCase();

  if (request.type === 'ERASURE') {
    const users = await prisma.user.findMany({
      where: {
        email,
        memberships: { some: { organizationId } },
      },
      select: { id: true, email: true },
    });
    for (const user of users) {
      if (user.id === session.user.id) continue;
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.account.deleteMany({ where: { userId: user.id } });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: `deleted-${user.id}@deleted.local`,
          name: 'Deleted User',
          image: null,
          passwordHash: null,
        },
      });
      affectedUsers += 1;
    }

    const leadsResult = await prisma.lead.updateMany({
      where: { email },
      data: {
        email: `deleted+${Date.now()}@deleted.local`,
        name: 'Deleted Lead',
        phone: null,
        message: null,
        company: 'Deleted',
      },
    });
    affectedLeads = leadsResult.count;
  }

  const updatedRequest = await prisma.gdprRequest.update({
    where: { id: request.id },
    data: {
      status: 'COMPLETED',
      processedAt: new Date(),
      processedByUserId: session.user.id as string,
    },
  });

  await writeProcessingRecord({
    organizationId,
    actorUserId: session.user.id as string,
    eventType: 'GDPR_REQUEST_EXECUTED',
    subjectRef: request.subjectEmail,
    legalBasis: 'art. 17 RODO',
    payload: {
      requestId: request.id,
      type: request.type,
      affectedUsers,
      affectedLeads,
    },
  });

  return NextResponse.json({ ok: true, request: updatedRequest, affectedUsers, affectedLeads });
}
