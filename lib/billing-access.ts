import type { Subscription } from '@prisma/client';

/**
 * Paywall dla tras opartych o JWT (middleware Edge): zgodne z dashboardem —
 * blokuje CANCELED, PAST_DUE oraz wygasły TRIALING.
 */
export function isJwtSubscriptionBlocking(
  subscriptionStatus: string | null | undefined,
  trialEndsAtIso: string | null | undefined,
): boolean {
  if (subscriptionStatus === 'CANCELED' || subscriptionStatus === 'PAST_DUE') return true;
  if (
    subscriptionStatus === 'TRIALING' &&
    trialEndsAtIso != null &&
    trialEndsAtIso !== '' &&
    new Date(trialEndsAtIso) < new Date()
  ) {
    return true;
  }
  return false;
}

/** Dostęp do funkcji produktu wg rekordu Subscription (API Node — klucze API, route handlers). */
export function isSubscriptionProductAccessAllowed(sub: Pick<Subscription, 'status' | 'trialEndsAt'>): boolean {
  if (sub.status === 'ACTIVE') return true;
  if (sub.status === 'TRIALING' && sub.trialEndsAt && sub.trialEndsAt.getTime() > Date.now()) return true;
  return false;
}

/**
 * Endpointy API wyłączone z paywalla sesji (publiczne, billing, crony, RODO, lista organizacji).
 */
export function isApiSessionBillingExempt(pathname: string): boolean {
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname.startsWith('/api/webhooks/')) return true;
  if (pathname.startsWith('/api/cron/')) return true;
  if (pathname === '/api/health' || pathname.startsWith('/api/health/')) return true;
  if (pathname.startsWith('/api/faq-assistant')) return true;
  if (pathname.startsWith('/api/contact')) return true;
  if (pathname.startsWith('/api/analytics/event')) return true;
  if (pathname.startsWith('/api/feedback')) return true;
  if (pathname.startsWith('/api/user/cookie-consent')) return true;
  if (pathname.startsWith('/api/billing/checkout')) return true;
  if (pathname.startsWith('/api/billing/portal')) return true;
  if (pathname.startsWith('/api/ksef/jobs/process')) return true;
  if (pathname.startsWith('/api/gdpr/')) return true;
  if (pathname === '/api/organizations' || pathname.startsWith('/api/organizations/')) return true;
  if (pathname === '/api/v1/openapi.json' || pathname.startsWith('/api/v1/openapi.json/')) return true;
  return false;
}
