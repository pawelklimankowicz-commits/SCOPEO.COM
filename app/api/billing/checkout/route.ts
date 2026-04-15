import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getOrCreateStripeCustomer, getPriceId, getSubscription } from '@/lib/billing';
import { stripe, TRIAL_DAYS } from '@/lib/stripe';

const schema = z.object({
  plan: z.enum(['MIKRO', 'STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE']),
  interval: z.enum(['MONTHLY', 'ANNUAL']),
});

function appBaseUrl(req: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`
  ).replace(/\/$/, '');
}

function canManage(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | null | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  try {
    const body = schema.parse(await req.json());
    if (body.plan === 'ENTERPRISE') {
      return NextResponse.json({ ok: true, redirect: '/kontakt' });
    }

    const organizationId = (session.user as any).organizationId as string;
    const customerId = await getOrCreateStripeCustomer(organizationId);
    const subscription = await getSubscription(organizationId);
    const baseUrl = appBaseUrl(req);

    if (
      subscription &&
      ['ACTIVE', 'PAST_DUE'].includes(subscription.status) &&
      Boolean(subscription.stripeSubscriptionId)
    ) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/dashboard/settings/billing`,
      });
      return NextResponse.json({ ok: true, url: portal.url });
    }

    const priceId = getPriceId(body.plan, body.interval);
    if (!priceId) {
      return NextResponse.json({ ok: false, error: 'Brak skonfigurowanej ceny Stripe dla planu.' }, { status: 400 });
    }

    const previousSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    });
    const canUseTrial = previousSubscriptions.data.length === 0;

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard/settings/billing?checkout=success`,
      cancel_url: `${baseUrl}/dashboard/settings/billing?checkout=cancel`,
      metadata: {
        plan: body.plan,
        interval: body.interval,
        organizationId,
      },
      subscription_data: {
        metadata: {
          plan: body.plan,
          interval: body.interval,
          organizationId,
        },
        ...(canUseTrial ? { trial_period_days: TRIAL_DAYS } : {}),
      },
      payment_method_collection: 'if_required',
    });

    return NextResponse.json({ ok: true, url: checkout.url });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
