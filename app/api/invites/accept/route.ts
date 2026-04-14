import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { hashInvitationToken } from '@/lib/invitations';
import { BCRYPT_SALT_ROUNDS } from '@/lib/password-hash';

const acceptInviteSchema = z.object({
  inviteToken: z.string().min(16),
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(8).optional(),
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

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email.toLowerCase() },
  });

  let userId: string;
  if (existingUser) {
    // User already exists — never overwrite their password from invite flow.
    userId = existingUser.id;
  } else {
    if (!parsed.password || typeof parsed.password !== 'string' || parsed.password.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(parsed.password, BCRYPT_SALT_ROUNDS);
    const newUser = await prisma.user.create({
      data: {
        email: invite.email.toLowerCase(),
        name: parsed.name ?? null,
        passwordHash,
      },
    });
    userId = newUser.id;
  }

  const existingMembership = await prisma.membership.findFirst({
    where: { userId, organizationId: invite.organizationId },
  });
  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        userId,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    });
  }

  await prisma.invitation.update({
    where: { id: invite.id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
