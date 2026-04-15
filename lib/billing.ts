import type { BillingInterval, Subscription, SubscriptionPlan } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PLANS, TRIAL_DAYS, stripe } from '@/lib/stripe';
import { createNotification } from '@/lib/notifications';

export function planLimits(plan: SubscriptionPlan) {
  const definition = PLANS[plan as keyof typeof PLANS];
  if (!definition) return { ksefConnectionLimit: 1, userLimit: 1 };
  return { ksefConnectionLimit: definition.ksefLimit, userLimit: definition.userLimit };
}

export async function getOrCreateStripeCustomer(organizationId: string): Promise<string> {
  const existing = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { stripeCustomerId: true },
  });
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, slug: true },
  });
  if (!organization) throw new Error('Organization not found');

  const customer = await stripe.customers.create({
    name: organization.name,
    metadata: { organizationId, organizationSlug: organization.slug },
  });

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.subscription.create({
    data: {
      organizationId,
      stripeCustomerId: customer.id,
      status: 'TRIALING',
      plan: 'MIKRO',
      billingInterval: 'MONTHLY',
      trialEndsAt,
      ...planLimits('MIKRO'),
    },
  });

  return customer.id;
}

export async function getSubscription(organizationId: string): Promise<Subscription | null> {
  return prisma.subscription.findUnique({ where: { organizationId } });
}

export function isTrialActive(sub: Subscription): boolean {
  return sub.status === 'TRIALING' && !!sub.trialEndsAt && sub.trialEndsAt.getTime() > Date.now();
}

export async function checkKsefLimit(organizationId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const [sub, connectionCount, legacyProfile] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId }, select: { ksefConnectionLimit: true } }),
    prisma.ksefConnection.count({ where: { organizationId } }),
    prisma.carbonProfile.findUnique({
      where: { organizationId },
      select: { ksefTokenEncrypted: true },
    }),
  ]);
  const used = connectionCount > 0 ? connectionCount : legacyProfile?.ksefTokenEncrypted ? 1 : 0;
  const limit = sub?.ksefConnectionLimit ?? 1;
  if (limit > 0 && used >= Math.ceil(limit * 0.8)) {
    await createNotification({
      organizationId,
      type: 'KSEF_LIMIT_WARNING',
      title: 'Zblizasz sie do limitu polaczen KSeF',
      body: `Wykorzystano ${used}/${limit} polaczen KSeF. Rozwaz zmiane planu.`,
      link: '/dashboard/settings/billing',
      deduplicateWithinHours: 24,
    });
  }
  return { allowed: used < limit, used, limit };
}

export async function checkUserLimit(organizationId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const [sub, used] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId }, select: { userLimit: true } }),
    prisma.membership.count({ where: { organizationId, status: 'ACTIVE' } }),
  ]);
  const limit = sub?.userLimit ?? 1;
  if (limit > 0 && used >= Math.ceil(limit * 0.8)) {
    await createNotification({
      organizationId,
      type: 'USER_LIMIT_WARNING',
      title: 'Zblizasz sie do limitu uzytkownikow',
      body: `Wykorzystano ${used}/${limit} miejsc w planie. Rozwaz zmiane planu.`,
      link: '/dashboard/settings/billing',
      deduplicateWithinHours: 24,
    });
  }
  return { allowed: used < limit, used, limit };
}

export function getPriceId(plan: SubscriptionPlan, interval: BillingInterval): string | null {
  const definition = PLANS[plan];
  if (!definition) return null;
  if (interval === 'ANNUAL') return definition.priceIdAnnual ?? null;
  return definition.priceIdMonthly ?? null;
}
