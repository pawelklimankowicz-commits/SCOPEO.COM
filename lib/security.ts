import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

let redis: Redis | null = null;
let hasWarnedMissingRedis = false;
const limiters: Record<string, Ratelimit> = {};

function getRedis() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) {
      return null;
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

function getLimiter(key: string, requests: number, window: string): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (!limiters[key]) {
    limiters[key] = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(requests, window as any),
      prefix: `scopeo:rl:${key}`,
    });
  }
  return limiters[key];
}

/** NextAuth przekazuje `headers` jako zwykły obiekt; route handlers — `Headers`. */
type HeaderSource = Headers | Record<string, string | string[] | undefined> | undefined;

function headerFirst(headers: HeaderSource, name: string): string | null {
  if (!headers) return null;
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name);
  }
  const o = headers as Record<string, string | string[] | undefined>;
  const lower = name.toLowerCase();
  const raw = o[lower] ?? o[name];
  if (raw == null) return null;
  const s = Array.isArray(raw) ? raw[0] : raw;
  const t = typeof s === 'string' ? s.trim() : String(s).trim();
  return t || null;
}

export function getClientIp(headers: HeaderSource): string {
  const vercelForwarded = headerFirst(headers, 'x-vercel-forwarded-for');
  if (vercelForwarded) {
    const first = vercelForwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headerFirst(headers, 'x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = headerFirst(headers, 'x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return '127.0.0.1';
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ ok: true; remaining: number } | { ok: false; retryAfterSec: number }> {
  const windowSec = Math.max(1, Math.floor(config.windowMs / 1000));
  const limiter = getLimiter(
    `${config.maxRequests}/${windowSec}s`,
    config.maxRequests,
    `${windowSec} s`
  );

  if (!limiter) {
    if (!hasWarnedMissingRedis) {
      hasWarnedMissingRedis = true;
      console.warn('[rate-limit] Upstash Redis not configured, rate limiting disabled');
    }
    return { ok: true, remaining: config.maxRequests };
  }

  const result = await limiter.limit(identifier);
  if (result.success) {
    return { ok: true, remaining: result.remaining };
  }
  return {
    ok: false,
    retryAfterSec: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
  };
}
