import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createInvitationToken } from '@/lib/invitations';
import { Resend } from 'resend';

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'ANALYST', 'REVIEWER', 'APPROVER', 'VIEWER']),
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

  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const inviteUrl = appUrl
    ? `${appUrl.replace(/\/$/, '')}/login?inviteToken=${encodeURIComponent(token)}`
    : null;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.LEADS_FROM_EMAIL;
  if (inviteUrl && resendKey && fromEmail) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: fromEmail,
      to: parsed.email.toLowerCase(),
      subject: 'Zaproszenie do Scopeo',
      text: `Otrzymujesz zaproszenie do organizacji w Scopeo. Użyj linku: ${inviteUrl}`,
    });
  }

  return NextResponse.json({ ok: true, invite, inviteUrl });
}
