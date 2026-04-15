import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { Resend } from 'resend';
import crypto from 'crypto';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`pwd-reset-req:${ip}`, { windowMs: 15 * 60_000, maxRequests: 5 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });

  const body = await req.json();
  const { email } = schema.parse(body);
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  await prisma.passwordResetToken.deleteMany({
    where: { email: normalizedEmail, usedAt: null },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { tokenHash, email: normalizedEmail, expiresAt },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  void resend.emails
    .send({
      from: process.env.LEADS_FROM_EMAIL ?? 'noreply@scopeo.com',
      to: normalizedEmail,
      subject: 'Reset hasła — Scopeo',
      text: `Otrzymaliśmy prośbę o reset hasła dla konta ${email}.\n\nKliknij link, aby ustawić nowe hasło:\n${resetUrl}\n\nLink ważny przez 1 godzinę. Jeśli nie prosiłeś o reset, zignoruj tę wiadomość.`,
    })
    .catch(console.error);

  return NextResponse.json({ ok: true });
}
