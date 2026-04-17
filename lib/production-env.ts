function isNonEmpty(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function requireMinLength(name: string, value: string | undefined, minLength: number) {
  if (!isNonEmpty(value) || value.trim().length < minLength) {
    throw new Error(`${name} must be set to at least ${minLength} characters in production.`);
  }
}

function requireBase64Key32(name: string, value: string | undefined) {
  if (!isNonEmpty(value)) {
    throw new Error(`${name} is required in production.`);
  }
  const decoded = Buffer.from(value.trim(), 'base64');
  if (decoded.length !== 32) {
    throw new Error(`${name} must be a base64-encoded 32-byte key in production.`);
  }
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function assertProductionAuthEnv() {
  if (!isProductionRuntime()) return;
  requireMinLength('AUTH_SECRET or NEXTAUTH_SECRET', process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET, 32);
}

export function assertProductionStripeEnv() {
  if (!isProductionRuntime()) return;
  requireMinLength('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY, 1);
}

export function assertProductionRateLimitEnv() {
  if (!isProductionRuntime()) return;
  requireMinLength('UPSTASH_REDIS_REST_URL', process.env.UPSTASH_REDIS_REST_URL, 1);
  requireMinLength('UPSTASH_REDIS_REST_TOKEN', process.env.UPSTASH_REDIS_REST_TOKEN, 1);
}

export function assertProductionCronEnv() {
  if (!isProductionRuntime()) return;
  requireMinLength('CRON_SECRET', process.env.CRON_SECRET, 16);
}

export function assertProductionKsefCryptoEnv() {
  if (!isProductionRuntime()) return;
  requireBase64Key32('DATA_ENCRYPTION_KEY', process.env.DATA_ENCRYPTION_KEY);
  requireBase64Key32('KSEF_TOKEN_ENCRYPTION_KEY', process.env.KSEF_TOKEN_ENCRYPTION_KEY);
}
