import * as Sentry from '@sentry/nextjs';

if (!process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  console.warn('[SENTRY] SENTRY_DSN is not set — error tracking is DISABLED in production.');
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  enabled: Boolean(process.env.SENTRY_DSN),
});
