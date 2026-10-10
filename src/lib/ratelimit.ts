// Simple in-memory sliding-window rate limiter.
// Suitable for a single-node deployment; swap for Redis/Upstash in multi-node production.

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

// Periodic cleanup to avoid unbounded growth.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < 15 * 60_000);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec: number };

/**
 * Rate limit an action.
 * @param key     stable identifier, e.g. `checkout:<ip>` or `download:<entitlementId>`
 * @param limit   max events per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - bucket.hits[0])) / 1000);
    buckets.set(key, bucket);
    return { ok: false, remaining: 0, retryAfterSec: Math.max(1, retryAfter) };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers (for rate limiting only, not for authorization). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}
