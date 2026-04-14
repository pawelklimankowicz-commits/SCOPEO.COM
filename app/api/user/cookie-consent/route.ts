import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { COOKIE_CONSENT_VERSION } from '@/lib/cookie-consent';
import { writeProcessingRecord } from '@/lib/privacy-register';

const bodySchema = z.object({
  choice: z.enum(['accepted', 'rejected']),
  consentVersion: z.string().min(1).max(64),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const row = await prisma.userConsent.findUnique({
    where: { userId: session.user.id },
  });
  if (!row || row.consentVersion !== COOKIE_CONSENT_VERSION) {
    return NextResponse.json({ ok: true, consent: null });
  }
  return NextResponse.json({
    ok: true,
    consent: {
      consentVersion: row.consentVersion,
      analyticsCookies: row.analyticsCookies,
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }
  const { choice, consentVersion } = parsed.data;
  if (consentVersion !== COOKIE_CONSENT_VERSION) {
    return NextResponse.json({ ok: false, error: 'Unsupported consent version' }, { status: 400 });
  }

  const analyticsCookies = choice === 'accepted';
  const userId = session.user.id;
  const organizationId = (session.user as { organizationId?: string | null }).organizationId ?? null;

  await prisma.userConsent.upsert({
    where: { userId },
    create: {
      userId,
      consentVersion,
      analyticsCookies,
    },
    update: {
      consentVersion,
      analyticsCookies,
    },
  });

  if (organizationId) {
    await writeProcessingRecord({
      organizationId,
      actorUserId: userId,
      eventType: 'COOKIE_CONSENT_UPDATED',
      subjectRef: session.user.email ?? userId,
      legalBasis: 'art. 6 ust. 1 lit. a RODO',
      payload: {
        consentVersion,
        analyticsCookies,
        choice,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
