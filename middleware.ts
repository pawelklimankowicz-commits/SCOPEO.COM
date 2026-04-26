import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isApiSessionBillingExempt, isJwtSubscriptionBlocking } from '@/lib/billing-access';

const CARBON_PAGE_CANONICAL = '/slad-weglowy';

/** Alias URL-i często wpisywane zamiast ASCII `/slad-weglowy` → unikamy „martwego” linku. */
function resolveCarbonFootprintAlias(pathname: string): string | null {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    /* zostaw surowy pathname */
  }
  if (decoded.length > 1 && decoded.endsWith('/')) {
    decoded = decoded.slice(0, -1);
  }
  const key = decoded.normalize('NFC').toLowerCase();
  const aliases = new Set(
    [
      '/carbon-footprint',
      '/sladweglowy',
      '/slad-węglowy',
      '/ślad-węglowy',
      '/ślad-weglowy',
    ].map((s) => s.normalize('NFC').toLowerCase()),
  );
  if (aliases.has(key)) {
    return CARBON_PAGE_CANONICAL;
  }
  return null;
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const carbonDest = resolveCarbonFootprintAlias(pathname);
  if (carbonDest) {
    const url = request.nextUrl.clone();
    url.pathname = carbonDest;
    return NextResponse.redirect(url, 308);
  }

  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === 'development';

  const publicMarketingApi = new Set([
    '/api/faq-assistant',
    '/api/faq-assistant/',
    '/api/contact',
    '/api/contact/',
    '/api/analytics/event',
    '/api/analytics/event/',
    '/api/feedback',
    '/api/feedback/',
    '/api/user/cookie-consent',
    '/api/user/cookie-consent/',
  ]);

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  const guardedPath =
    pathname.startsWith('/dashboard') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/'));
  const activeOrganizationId =
    typeof token?.activeOrganizationId === 'string'
      ? token.activeOrganizationId
      : typeof token?.organizationId === 'string'
        ? token.organizationId
        : null;
  const organizations = Array.isArray(token?.organizations)
    ? (token?.organizations as Array<{ id?: string }>).map((item) => item?.id).filter(Boolean)
    : [];
  if (
    guardedPath &&
    activeOrganizationId &&
    organizations.length > 0 &&
    !organizations.includes(activeOrganizationId) &&
    !publicMarketingApi.has(pathname)
  ) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, error: 'Invalid organization context' }, { status: 403 });
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }
  const role = typeof token?.role === 'string' ? token.role : null;
  const onboardingCompletedAt =
    typeof token?.onboardingCompletedAt === 'string' ? token.onboardingCompletedAt : null;
  const ownerNeedsOnboarding = role === 'OWNER' && !onboardingCompletedAt;

  if (ownerNeedsOnboarding && pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/onboarding/step/1';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }
  if (
    ownerNeedsOnboarding &&
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth/') &&
    !pathname.startsWith('/api/onboarding/') &&
    pathname !== '/api/ksef/test' &&
    !publicMarketingApi.has(pathname)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Onboarding wymagany. Dokoncz konfiguracje organizacji.',
      },
      { status: 403 }
    );
  }
  if (!ownerNeedsOnboarding && pathname.startsWith('/onboarding')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  const subscriptionStatus = typeof token?.subscriptionStatus === 'string' ? token.subscriptionStatus : null;
  const trialEndsAt = typeof token?.trialEndsAt === 'string' ? token.trialEndsAt : null;
  const billingBlocksProduct = isJwtSubscriptionBlocking(subscriptionStatus, trialEndsAt);
  const isDashboardPath = pathname.startsWith('/dashboard');
  const isBillingAllowedPath =
    pathname === '/dashboard/billing-required' || pathname === '/dashboard/settings/billing';
  if (isDashboardPath && !isBillingAllowedPath && billingBlocksProduct) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard/billing-required';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  if (
    token &&
    pathname.startsWith('/api/') &&
    !isApiSessionBillingExempt(pathname) &&
    billingBlocksProduct
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Subskrypcja nieaktywna lub trial wygasł. Odnów dostęp w ustawieniach rozliczeń.',
        code: 'BILLING_REQUIRED',
      },
      { status: 403 },
    );
  }

  const cspHeader = [
    "default-src 'self'",
    `img-src 'self' data: https:`,
    `media-src 'self' https://*.public.blob.vercel-storage.com`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' https://o*.ingest.sentry.io https://*.sentry.io`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
