import type { BillingInterval, Subscription, SubscriptionPlan } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PLANS, TRIAL_DAYS, stripe } from '@/lib/stripe';
import { createNotification } from '@/lib/notifications';

export function planLimits(plan: SubscriptionPlan) {
  if (plan === 'STARTER') return { ksefConnectionLimit: 1, userLimit: 5 };
  if (plan === 'GROWTH') return { ksefConnectionLimit: 3, userLimit: 15 };
  if (plan === 'SCALE') return { ksefConnectionLimit: 10, userLimit: 999 };
  if (plan === 'ENTERPRISE') return { ksefConnectionLimit: 999, userLimit: 999 };
  return { ksefConnectionLimit: 1, userLimit: 1 };
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
  const [sub, profile] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId }, select: { ksefConnectionLimit: true } }),
    prisma.carbonProfile.findUnique({ where: { organizationId }, select: { taxId: true } }),
  ]);
  const limit = sub?.ksefConnectionLimit ?? 1;
  const used = profile?.taxId ? 1 : 0;
  if (limit > 0 && used >= Math.ceil(limit * 0.8)) {
    const existing = await prisma.notification.findFirst({
      where: {
        organizationId,
        type: 'INVOICE_LIMIT_WARNING',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (!existing) {
      await createNotification({
        organizationId,
        type: 'INVOICE_LIMIT_WARNING',
        title: 'Wysokie wykorzystanie limitu KSeF',
        body: `Wykorzystano ${used}/${limit} limitu polaczen KSeF.`,
        link: '/dashboard/settings/billing',
      });
    }
  }
  return { allowed: used < limit, used, limit };
}

export async function checkUserLimit(organizationId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const [sub, used] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId }, select: { userLimit: true } }),
    prisma.membership.count({ where: { organizationId } }),
  ]);
  const limit = sub?.userLimit ?? 1;
  if (limit > 0 && used >= Math.ceil(limit * 0.8)) {
    const existing = await prisma.notification.findFirst({
      where: {
        organizationId,
        type: 'INVOICE_LIMIT_WARNING',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (!existing) {
      await createNotification({
        organizationId,
        type: 'INVOICE_LIMIT_WARNING',
        title: 'Wysokie wykorzystanie limitu uzytkownikow',
        body: `Wykorzystano ${used}/${limit} miejsc w planie.`,
        link: '/dashboard/settings/billing',
      });
    }
  }
  return { allowed: used < limit, used, limit };
}

export function getPriceId(plan: SubscriptionPlan, interval: BillingInterval): string | null {
  const definition = PLANS[plan];
  if (!definition) return null;
  if (interval === 'ANNUAL') return definition.priceIdAnnual ?? null;
  return definition.priceIdMonthly ?? null;
}
