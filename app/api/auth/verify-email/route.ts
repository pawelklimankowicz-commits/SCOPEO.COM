import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!token || token.length < 32) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.verifiedAt || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/login?error=token_expired', req.url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { tokenHash },
      data: { verifiedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(new URL('/login?verified=1', req.url));
}
