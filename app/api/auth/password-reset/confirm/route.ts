import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { BCRYPT_SALT_ROUNDS } from '@/lib/password-hash';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(12, 'Hasło musi mieć co najmniej 12 znaków').max(128),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`pwd-reset-confirm:${ip}`, { windowMs: 15 * 60_000, maxRequests: 10 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });

  const body = await req.json();
  const { token, password } = schema.parse(body);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: 'Token nieprawidłowy lub wygasł.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
