import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { planLimits } from '@/lib/billing';
import { assertStripeConfigured, stripe } from '@/lib/stripe';
import { paymentFailedEmail, trialEndingEmail } from '@/lib/email-templates';

function statusFromStripe(status: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' {
  if (status === 'trialing') return 'TRIALING';
  if (status === 'active') return 'ACTIVE';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'PAST_DUE';
  return 'CANCELED';
}

function normalizePlan(value: string | null | undefined) {
  const normalized = String(value || '').toUpperCase();
  if (['MIKRO', 'STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE'].includes(normalized)) {
    return normalized as 'MIKRO' | 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';
  }
  return 'MIKRO';
}

function normalizeInterval(value: string | null | undefined) {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'ANNUAL') return 'ANNUAL' as const;
  return 'MONTHLY' as const;
}

async function findOrganizationIdByCustomer(customerId: string): Promise<string | null> {
  const record = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    select: { organizationId: true },
  });
  if (record?.organizationId) return record.organizationId;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  const fromMetadata = customer.metadata?.organizationId;
  return fromMetadata || null;
}

async function sendBillingEmail(to: string, subject: string, text: string, html?: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;
  const resend = new Resend(resendKey);
  void resend.emails.send({
    from: process.env.LEADS_FROM_EMAIL ?? 'noreply@scopeo.pl',
    to,
    subject,
    html,
    text,
  });
}

async function persistSubscription(input: {
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: 'MIKRO' | 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';
  billingInterval: 'MONTHLY' | 'ANNUAL';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
  trialEndsAt?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const limits = planLimits(input.plan);
  if (input.stripeSubscriptionId) {
    const existingByStripe = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: input.stripeSubscriptionId },
      select: { id: true },
    });
    if (existingByStripe) {
      await prisma.subscription.update({
        where: { id: existingByStripe.id },
        data: {
          organizationId: input.organizationId,
          stripeCustomerId: input.stripeCustomerId,
          stripeSubscriptionId: input.stripeSubscriptionId,
          plan: input.plan,
          billingInterval: input.billingInterval,
          status: input.status,
          trialEndsAt: input.trialEndsAt ?? null,
          currentPeriodEnd: input.currentPeriodEnd ?? null,
          cancelAtPeriodEnd: Boolean(input.cancelAtPeriodEnd),
          ...limits,
        },
      });
      return;
    }
  }
  await prisma.subscription.upsert({
    where: { organizationId: input.organizationId },
    update: {
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      plan: input.plan,
      billingInterval: input.billingInterval,
      status: input.status,
      trialEndsAt: input.trialEndsAt ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: Boolean(input.cancelAtPeriodEnd),
      ...limits,
    },
    create: {
      organizationId: input.organizationId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      plan: input.plan,
      billingInterval: input.billingInterval,
      status: input.status,
      trialEndsAt: input.trialEndsAt ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: Boolean(input.cancelAtPeriodEnd),
      ...limits,
    },
  });
}

export async function POST(req: NextRequest) {
  assertStripeConfigured();
  const signature = req.headers.get('stripe-signature');
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'Missing webhook signature' }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = String(session.customer || '');
      const organizationId =
        session.metadata?.organizationId || (await findOrganizationIdByCustomer(customerId));
      if (customerId && organizationId) {
        const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
        if (stripeSubscriptionId) {
          const alreadyHandled = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId },
            select: { id: true },
          });
          if (alreadyHandled) {
            return NextResponse.json({ ok: true });
          }
        }
        const plan = normalizePlan(session.metadata?.plan);
        const interval = normalizeInterval(session.metadata?.interval);
        await persistSubscription({
          organizationId,
          stripeCustomerId: customerId,
          stripeSubscriptionId,
          plan,
          billingInterval: interval,
          status: session.subscription ? 'ACTIVE' : 'TRIALING',
        });
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = String(subscription.customer);
      const currentPeriodEndEpoch = Number((subscription as any).current_period_end ?? 0);
      const organizationId =
        subscription.metadata?.organizationId || (await findOrganizationIdByCustomer(customerId));
      if (organizationId) {
        const plan = normalizePlan(subscription.metadata?.plan);
        const interval = normalizeInterval(subscription.metadata?.interval);
        await persistSubscription({
          organizationId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          plan,
          billingInterval: interval,
          status: statusFromStripe(subscription.status),
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          currentPeriodEnd: currentPeriodEndEpoch > 0 ? new Date(currentPeriodEndEpoch * 1000) : null,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        });
      }
    }

    if (event.type === 'customer.subscription.trial_will_end') {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = await findOrganizationIdByCustomer(String(subscription.customer));
      if (organizationId) {
        const recipients = await prisma.membership.findMany({
          where: { organizationId, role: { in: ['OWNER', 'ADMIN'] }, status: 'ACTIVE' },
          include: { user: true },
        });
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
        const billingUrl = `${appUrl}/dashboard/settings/billing`;
        const daysLeft = 3;
        await Promise.all(
          recipients.map(({ user }) => {
            const email = trialEndingEmail(user.name ?? 'zespole', daysLeft, billingUrl);
            return sendBillingEmail(user.email, email.subject, email.text, email.html);
          })
        );
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer && typeof invoice.customer === 'object'
            ? invoice.customer.id
            : '';
      const organizationId = await findOrganizationIdByCustomer(customerId);
      if (organizationId) {
        await prisma.subscription.updateMany({
          where: { organizationId },
          data: { status: 'PAST_DUE' },
        });
        const recipients = await prisma.membership.findMany({
          where: { organizationId, role: { in: ['OWNER', 'ADMIN'] }, status: 'ACTIVE' },
          include: { user: true },
        });
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
        const portalUrl = `${appUrl}/dashboard/settings/billing`;
        await Promise.all(
          recipients.map(({ user }) => {
            const email = paymentFailedEmail(user.name ?? 'zespole', portalUrl);
            return sendBillingEmail(user.email, email.subject, email.text, email.html);
          })
        );
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = await findOrganizationIdByCustomer(String(subscription.customer));
      if (organizationId) {
        await prisma.subscription.updateMany({
          where: { organizationId },
          data: {
            stripeSubscriptionId: null,
            status: 'CANCELED',
            plan: 'MIKRO',
            billingInterval: 'MONTHLY',
            cancelAtPeriodEnd: false,
            ...planLimits('MIKRO'),
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Webhook handling failed' },
      { status: 500 }
    );
  }
}
