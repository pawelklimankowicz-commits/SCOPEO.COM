import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/schema';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { BCRYPT_SALT_ROUNDS } from '@/lib/password-hash';
import { Resend } from 'resend';
import crypto from 'crypto';
import { verificationEmail } from '@/lib/email-templates';
import { runWithRlsBypass } from '@/lib/tenant-rls-context';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = await checkRateLimit(`register:${ip}`, {
      windowMs: 60 * 60_000,
      maxRequests: 5,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: 'Too many registration attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      );
    }
    const body = await req.json();
    const parsed = registerSchema.parse(body);
    const passwordHash = await bcrypt.hash(parsed.password, BCRYPT_SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        passwordHash,
        memberships: {
          create: {
            role: 'OWNER',
            status: 'ACTIVE',
            organization: {
              create: {
                name: parsed.organizationName,
                slug: parsed.slug,
                regionCode: 'PL',
              },
            },
          },
        },
      },
      include: {
        memberships: {
          select: { organizationId: true },
          orderBy: { id: 'asc' },
          take: 1,
        },
      },
    });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        email: parsed.email.toLowerCase(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
    const email = verificationEmail(parsed.name, verifyUrl);
    const resend = new Resend(process.env.RESEND_API_KEY);
    void resend.emails
      .send({
        from: process.env.LEADS_FROM_EMAIL ?? 'noreply@scopeo.pl',
        to: parsed.email.toLowerCase(),
        subject: email.subject,
        html: email.html,
        text: email.text,
      })
      .catch(console.error);
    const orgId = user.memberships[0]?.organizationId;
    if (orgId) {
      await runWithRlsBypass(() =>
        prisma.journeyEvent.create({
          data: {
            source: 'APP',
            name: 'app.register_account_created',
            userId: user.id,
            organizationId: orgId,
            path: '/register',
            properties: { flow: 'password_register' as const },
          },
        })
      );
    }
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target : target != null ? [String(target)] : [];
      if (fields.includes('email')) {
        return NextResponse.json(
          { ok: false, error: 'Konto z tym adresem email już istnieje.' },
          { status: 409 }
        );
      }
      if (fields.includes('slug')) {
        return NextResponse.json(
          { ok: false, error: 'Ten identyfikator organizacji (slug) jest już zajęty.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: 'Podana wartość jest już zajęta.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
