type RateLimitConfig = {
  windowMs: number;
  max: number;
  blockMs?: number;
};

type RateLimitState = {
  count: number;
  windowStart: number;
  blockedUntil: number;
};

const rateStore = new Map<string, RateLimitState>();

function now() {
  return Date.now();
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip') ?? 'unknown';
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
  const timestamp = now();
  const existing = rateStore.get(key);

  if (!existing) {
    rateStore.set(key, {
      count: 1,
      windowStart: timestamp,
      blockedUntil: 0,
    });
    return { ok: true, remaining: config.max - 1 };
  }

  if (existing.blockedUntil > timestamp) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.blockedUntil - timestamp) / 1000)),
    };
  }

  if (timestamp - existing.windowStart >= config.windowMs) {
    existing.windowStart = timestamp;
    existing.count = 1;
    existing.blockedUntil = 0;
    rateStore.set(key, existing);
    return { ok: true, remaining: config.max - 1 };
  }

  existing.count += 1;
  if (existing.count > config.max) {
    existing.blockedUntil = timestamp + (config.blockMs ?? config.windowMs);
    rateStore.set(key, existing);
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.blockedUntil - timestamp) / 1000)),
    };
  }

  rateStore.set(key, existing);
  return { ok: true, remaining: Math.max(0, config.max - existing.count) };
}
