const WINDOW_MS = 60_000;
const REQUESTS_PER_WINDOW = 12;

type Bucket = { count: number; resetAt: number };

const globalRateLimit = globalThis as typeof globalThis & {
  __axiomDocsAiRateLimit?: Map<string, Bucket>;
};

const buckets = globalRateLimit.__axiomDocsAiRateLimit ?? new Map<string, Bucket>();
globalRateLimit.__axiomDocsAiRateLimit = buckets;

export function takeAiRequest(clientId: string, now = Date.now()) {
  const existing = buckets.get(clientId);
  if (!existing || existing.resetAt <= now) {
    buckets.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1_000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
