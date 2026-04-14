import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/schema';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { BCRYPT_SALT_ROUNDS } from '@/lib/password-hash';

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
    });
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
