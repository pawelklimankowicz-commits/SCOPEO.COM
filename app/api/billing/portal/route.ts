import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrCreateStripeCustomer } from '@/lib/billing';
import { assertStripeConfigured, stripe } from '@/lib/stripe';

function canManage(role?: string | null) {
  return role === 'OWNER' || role === 'ADMIN';
}

function appBaseUrl(req: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`
  ).replace(/\/$/, '');
}

export async function POST(req: NextRequest) {
  assertStripeConfigured();
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role as string | undefined;
  if (!canManage(role)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const organizationId = (session.user as any).organizationId as string;
  const customerId = await getOrCreateStripeCustomer(organizationId);
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appBaseUrl(req)}/dashboard/settings/billing`,
  });
  return NextResponse.json({ ok: true, url: portal.url });
}
