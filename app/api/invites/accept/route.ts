import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { hashInvitationToken } from '@/lib/invitations';

const acceptInviteSchema = z.object({
  inviteToken: z.string().min(16),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = acceptInviteSchema.parse(body);
  const tokenHash = hashInvitationToken(parsed.inviteToken);
  const email = parsed.email.toLowerCase();
  const invite = await prisma.invitation.findUnique({ where: { tokenHash } });
  if (!invite || invite.status !== 'PENDING') {
    return NextResponse.json({ ok: false, error: 'Invalid invitation token' }, { status: 400 });
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.invitation.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
    });
    return NextResponse.json({ ok: false, error: 'Invitation expired' }, { status: 400 });
  }
  if (invite.email.toLowerCase() !== email) {
    return NextResponse.json({ ok: false, error: 'Invitation email mismatch' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: parsed.name,
      passwordHash,
    },
    create: {
      email,
      name: parsed.name,
      passwordHash,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: invite.organizationId,
      },
    },
    update: { role: invite.role },
    create: {
      userId: user.id,
      organizationId: invite.organizationId,
      role: invite.role,
    },
  });

  await prisma.invitation.update({
    where: { id: invite.id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
