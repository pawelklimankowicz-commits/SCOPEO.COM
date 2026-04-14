import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

function now() {
  return Date.now();
}

export function getClientIp(headers: Headers): string {
  const vercelForwarded = headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) {
    const first = vercelForwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return 'unknown';
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ ok: true; remaining: number } | { ok: false; retryAfterSec: number }> {
  if (redis) {
    const bucketSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.max, `${bucketSeconds} s`),
      analytics: true,
      prefix: 'scopeo:ratelimit',
    });
    const result = await ratelimit.limit(key);
    if (!result.success) {
      const resetMs = typeof result.reset === 'number' ? result.reset : Date.now() + config.windowMs;
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((resetMs - Date.now()) / 1000)),
      };
    }
    return { ok: true, remaining: result.remaining };
  }

  // Fallback for local/dev when Upstash env is unavailable.
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
