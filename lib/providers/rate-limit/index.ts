/**
 * In-memory sliding-window rate limiter for the v1 REST API.
 *
 * Limits are per API key, per 60-second window:
 *   read_only  → 100 requests / 60s
 *   read_write → 300 requests / 60s
 *   admin      → 1000 requests / 60s
 *
 * The store resets on server restart — acceptable for MVP on Vercel
 * serverless where each invocation is short-lived. Upgrade to Upstash
 * Redis when you need persistent limits across instances.
 *
 * Usage:
 *   const rl = checkRateLimit(ctx.keyId, ctx.permissions);
 *   if (!rl.allowed) return err("Rate limit exceeded", 429);
 *   res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
 */

const WINDOW_MS = 60_000; // 1 minute

const LIMITS: Record<string, number> = {
  read_only: 100,
  read_write: 300,
  admin: 1000,
};

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number; // unix ms
};

export function checkRateLimit(
  keyId: string,
  permissions: string
): RateLimitResult {
  const limit = LIMITS[permissions] ?? LIMITS.read_only;
  const now = Date.now();

  let entry = store.get(keyId);

  // Expired window — reset
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(keyId, entry);
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    limit,
    resetAt: entry.resetAt,
  };
}

/** Expose for tests / monitoring */
export function getRateLimitStore(): Map<string, Entry> {
  return store;
}
