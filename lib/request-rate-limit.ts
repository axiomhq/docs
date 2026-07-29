import { createHash } from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitKind = 'chat' | 'try';
export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  unavailable?: boolean;
};

const limits: Record<RateLimitKind, { requests: number; windowMs: number }> = {
  chat: { requests: 12, windowMs: 60_000 },
  try: { requests: 8, windowMs: 60_000 },
};

type Bucket = { count: number; resetAt: number };
const localBuckets = new Map<string, Bucket>();

let remoteLimiters: Record<RateLimitKind, Ratelimit> | null | undefined;

function getRemoteLimiters() {
  if (remoteLimiters !== undefined) return remoteLimiters;

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    remoteLimiters = null;
    return remoteLimiters;
  }

  const redis = new Redis({ url, token });
  remoteLimiters = {
    chat: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limits.chat.requests, '1 m'),
      prefix: 'axiom-docs:rate-limit:chat',
      analytics: false,
    }),
    try: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limits.try.requests, '1 m'),
      prefix: 'axiom-docs:rate-limit:try',
      analytics: false,
    }),
  };
  return remoteLimiters;
}

export function hashRateLimitIdentifier(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function clientIdentifier(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const value = (forwarded || request.headers.get('x-real-ip') || 'local').slice(0, 128);
  return hashRateLimitIdentifier(value);
}

export function takeLocalRateLimit(kind: RateLimitKind, identifier: string, now = Date.now()): RateLimitResult {
  const key = `${kind}:${identifier}`;
  const config = limits[kind];
  const existing = localBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= config.requests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1_000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function limitRequest(kind: RateLimitKind, request: Request): Promise<RateLimitResult> {
  // Unit tests exercise the deterministic local limiter directly. Route tests must never contact
  // a shared Redis instance or consume another test's quota.
  if (process.env.NODE_ENV === 'test') return { allowed: true, retryAfterSeconds: 0 };

  const identifier = clientIdentifier(request);
  const remote = getRemoteLimiters();
  if (!remote) {
    if (process.env.NODE_ENV === 'production') {
      return { allowed: false, retryAfterSeconds: 0, unavailable: true };
    }
    return takeLocalRateLimit(kind, identifier);
  }

  try {
    const result = await remote[kind].limit(identifier);
    return {
      allowed: result.success,
      retryAfterSeconds: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1_000)),
    };
  } catch {
    // A missing or unavailable shared limiter must not turn an unauthenticated production endpoint
    // into an unmetered proxy. Local development retains the bounded in-memory fallback.
    if (process.env.NODE_ENV === 'production') {
      return { allowed: false, retryAfterSeconds: 0, unavailable: true };
    }
    return takeLocalRateLimit(kind, identifier);
  }
}
