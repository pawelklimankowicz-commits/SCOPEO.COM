import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createInvitationToken, sendInvitationEmail } from '@/lib/invitations';
import { checkRateLimit, getClientIp } from '@/lib/security';

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'ANALYST', 'REVIEWER', 'APPROVER', 'VIEWER']),
});
const updateInviteSchema = z.object({
  inviteId: z.string().min(1),
  action: z.enum(['cancel', 'resend']),
});

function canManageInvites(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | null | undefined;
  if (!canManageInvites(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId = (session.user as any).organizationId as string;
  await prisma.invitation.updateMany({
    where: {
      organizationId,
      status: 'PENDING',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  });
  const invites = await prisma.invitation.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ ok: true, invites });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | null | undefined;
  if (!canManageInvites(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId = (session.user as any).organizationId as string;
  const userId = session.user.id as string;
  const ip = getClientIp(req.headers);
  const limit = await checkRateLimit(`invites-create:${organizationId}:${userId}:${ip}`, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 30,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many invite requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const body = await req.json();
  const parsed = createInviteSchema.parse(body);
  const { token, tokenHash } = createInvitationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await prisma.invitation.create({
    data: {
      organizationId,
      email: parsed.email.toLowerCase(),
      role: parsed.role,
      tokenHash,
      inviterUserId: session.user.id as string,
      expiresAt,
    },
  });

  try {
    await sendInvitationEmail({ email: parsed.email.toLowerCase(), token });
  } catch {
    await prisma.invitation.delete({ where: { id: invite.id } });
    return NextResponse.json(
      {
        ok: false,
        error: 'Nie udało się wysłać emaila z zaproszeniem. Sprawdź konfigurację serwisu email.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, invite });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | null | undefined;
  if (!canManageInvites(role)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const organizationId = (session.user as any).organizationId as string;
  const body = await req.json();
  const parsed = updateInviteSchema.parse(body);
  const invite = await prisma.invitation.findFirst({
    where: { id: parsed.inviteId, organizationId },
  });
  if (!invite) return NextResponse.json({ ok: false, error: 'Invite not found' }, { status: 404 });

  if (parsed.action === 'cancel') {
    if (invite.status === 'ACCEPTED') {
      return NextResponse.json({ ok: false, error: 'Accepted invite cannot be cancelled' }, { status: 400 });
    }
    const updated = await prisma.invitation.update({
      where: { id: invite.id },
      data: { status: 'CANCELLED' },
    });
    return NextResponse.json({ ok: true, invite: updated });
  }

  if (invite.status !== 'PENDING' && invite.status !== 'EXPIRED') {
    return NextResponse.json({ ok: false, error: 'Invite is not resendable' }, { status: 400 });
  }
  const { token, tokenHash } = createInvitationToken();
  const updated = await prisma.invitation.update({
    where: { id: invite.id },
    data: {
      tokenHash,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  await sendInvitationEmail({ email: invite.email, token });
  return NextResponse.json({ ok: true, invite: updated });
}
