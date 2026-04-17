import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { planLimits } from '@/lib/billing';
import { assertProductionCronEnv } from '@/lib/production-env';

export async function GET(req: Request) {
  assertProductionCronEnv();
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const mikroLimits = planLimits('MIKRO');
  const result = await prisma.subscription.updateMany({
    where: {
      status: 'TRIALING',
      trialEndsAt: { lt: now },
    },
    data: {
      status: 'CANCELED',
      plan: 'MIKRO',
      ...mikroLimits,
    },
  });

  logger.info({
    context: 'cron_expire_trials',
    message: 'Expired trial subscriptions',
    expired: result.count,
  });

  return NextResponse.json({ ok: true, expired: result.count });
}
