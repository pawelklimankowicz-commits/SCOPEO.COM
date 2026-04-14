import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/schema';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = await checkRateLimit(`register:${ip}`, { windowMs: 60 * 60_000, max: 5 });
    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, error: 'Too many registration attempts' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }
    const body = await req.json();
    const parsed = registerSchema.parse(body);
    const passwordHash = await bcrypt.hash(parsed.password, 10);
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
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
