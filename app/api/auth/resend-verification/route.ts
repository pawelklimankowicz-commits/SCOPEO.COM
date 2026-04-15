import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { Resend } from 'resend';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`resend-verify:${ip}`, { windowMs: 15 * 60_000, maxRequests: 5 });
  if (!rl.ok) {
    return NextResponse.redirect(new URL('/dashboard?verify_resent=rate_limited', req.url));
  }

  const email = String(session.user.email).toLowerCase();
  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true, name: true },
  });
  if (!dbUser || dbUser.emailVerified) {
    return NextResponse.redirect(new URL('/dashboard?verify_resent=skip', req.url));
  }

  await prisma.emailVerificationToken.deleteMany({
    where: { email, verifiedAt: null },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.emailVerificationToken.create({
    data: {
      tokenHash,
      email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  void resend.emails
    .send({
      from: process.env.LEADS_FROM_EMAIL ?? 'noreply@scopeo.com',
      to: email,
      subject: 'Potwierdź adres email — Scopeo',
      text: `Witaj ${dbUser.name ?? ''},\n\nAby potwierdzić adres email, kliknij:\n\n${verifyUrl}\n\nLink ważny przez 24 godziny.`,
    })
    .catch(console.error);

  return NextResponse.redirect(new URL('/dashboard?verify_resent=1', req.url));
}
