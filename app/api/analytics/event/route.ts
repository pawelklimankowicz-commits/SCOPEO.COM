import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runWithRlsBypass, runWithTenantRls } from '@/lib/tenant-rls-context';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  source: z.enum(['MARKETING', 'APP']),
  name: z.string().min(1).max(120),
  path: z.string().max(500).optional().nullable(),
  /** Zaufane tylko dla marketingu — klient wysyła true po localStorage. */
  marketingConsent: z.boolean().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

const MAX_PROPS = 2_000;

function toJsonProps(
  raw: z.infer<typeof bodySchema>['properties']
): Prisma.InputJsonValue | undefined {
  if (raw == null) return undefined;
  const s = JSON.stringify(raw);
  if (s.length > MAX_PROPS) {
    return { _truncated: true, n: s.length } as const;
  }
  return raw as Prisma.InputJsonValue;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);
    if (parsed.source === 'MARKETING') {
      if (parsed.marketingConsent !== true) {
        return new NextResponse(null, { status: 204 });
      }
      const ip = getClientIp(req.headers);
      const limit = await checkRateLimit(`journey-mkt:${ip}`, {
        windowMs: 60_000,
        maxRequests: 30,
      });
      if (!limit.ok) {
        return new NextResponse(null, { status: 204 });
      }
      await runWithRlsBypass(() =>
        prisma.journeyEvent.create({
          data: {
            source: 'MARKETING',
            name: parsed.name,
            path: parsed.path?.trim() || null,
            userId: null,
            organizationId: null,
            properties: toJsonProps(parsed.properties),
          },
        })
      );
      return NextResponse.json({ ok: true });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId =
      (session as { activeOrganizationId?: string }).activeOrganizationId ||
      (session as { organizationId?: string }).organizationId ||
      (session.user as { organizationId?: string }).organizationId;
    if (!organizationId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id as string;
    const limit = await checkRateLimit(`journey-app:${organizationId}:${userId}`, {
      windowMs: 60_000,
      maxRequests: 200,
    });
    if (!limit.ok) {
      return new NextResponse(null, { status: 204 });
    }

    await runWithTenantRls({ userId, organizationId }, () =>
      prisma.journeyEvent.create({
        data: {
          source: 'APP',
          name: parsed.name,
          path: parsed.path?.trim() || null,
          userId,
          organizationId,
          properties: toJsonProps(parsed.properties),
        },
      })
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }
    logger.error({
      context: 'journey_event',
      message: 'POST failed',
      error: e instanceof Error ? e.message : 'Unknown',
    });
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
