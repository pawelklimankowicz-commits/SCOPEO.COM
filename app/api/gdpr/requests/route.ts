import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { writeProcessingRecord } from '@/lib/privacy-register';

const createRequestSchema = z.object({
  subjectEmail: z.string().email(),
  type: z.enum(['ACCESS', 'ERASURE']),
  notes: z.string().max(2000).optional(),
});

function canManage(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const role = (session.user as any).role as string | null | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const requests = await prisma.gdprRequest.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, requests });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session.user as any).organizationId as string;
  const role = (session.user as any).role as string | null | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = createRequestSchema.parse(body);
  const created = await prisma.gdprRequest.create({
    data: {
      organizationId,
      requesterUserId: session.user.id as string,
      subjectEmail: parsed.subjectEmail.toLowerCase(),
      type: parsed.type,
      notes: parsed.notes ?? null,
    },
  });

  await writeProcessingRecord({
    organizationId,
    actorUserId: session.user.id as string,
    eventType: 'GDPR_REQUEST_CREATED',
    subjectRef: parsed.subjectEmail.toLowerCase(),
    legalBasis: 'art. 12-17 RODO',
    payload: { requestId: created.id, type: created.type },
  });

  return NextResponse.json({ ok: true, request: created });
}
