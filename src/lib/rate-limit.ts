import { NextResponse } from 'next/server';

/*
! Lightweight in-memory rate limiter (token bucket).
!
! Scope: per-process. Suitable for the current single-instance Next.js
! deployment. If/when the app moves to multiple instances, swap the backing
! store for Redis (Upstash) — interface stays the same.
!
! Buckets are keyed by `<route>:<actor>` so different routes have
! independent budgets. `actor` should be the authenticated userId when
! available, falling back to client IP for unauthenticated requests
! (login/register). This prevents one user from being throttled by an
! unrelated heavy user on the same NAT.
!
! Cleanup: stale buckets are dropped lazily when they next refill, plus a
! periodic sweep (every minute) to bound memory under high churn.
*/

interface Bucket {
  tokens: number;
  refilledAt: number;
}

interface RateLimitConfig {
  /** Max tokens in the bucket (burst capacity). */
  limit: number;
  /** Window in milliseconds over which `limit` tokens are restored. */
  windowMs: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweepStale(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  buckets.forEach((bucket, key) => {
    if (now - bucket.refilledAt > windowMs * 5) buckets.delete(key);
  });
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  sweepStale(now, config.windowMs);

  const existing = buckets.get(key);
  if (!existing) {
    buckets.set(key, { tokens: config.limit - 1, refilledAt: now });
    return { allowed: true, remaining: config.limit - 1, resetMs: config.windowMs };
  }

  const elapsed = now - existing.refilledAt;
  if (elapsed >= config.windowMs) {
    existing.tokens = config.limit - 1;
    existing.refilledAt = now;
    return { allowed: true, remaining: existing.tokens, resetMs: config.windowMs };
  }

  if (existing.tokens > 0) {
    existing.tokens -= 1;
    return { allowed: true, remaining: existing.tokens, resetMs: config.windowMs - elapsed };
  }

  return { allowed: false, remaining: 0, resetMs: config.windowMs - elapsed };
}

export function getRequestActor(request: Request, userId: number | null): string {
  if (userId !== null) return `u:${userId}`;
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

export interface RateLimitGuard {
  /** Route identifier — used as the bucket key prefix so each route has its own budget. */
  route: string;
  limit: number;
  windowMs: number;
}

/**
 * Convenience wrapper that returns a 429 NextResponse when over budget.
 * Returns `null` when the request is allowed; the caller should continue.
 */
export function enforceRateLimit(
  request: Request,
  userId: number | null,
  guard: RateLimitGuard,
): NextResponse | null {
  const actor = getRequestActor(request, userId);
  const key = `${guard.route}:${actor}`;
  const result = checkRateLimit(key, { limit: guard.limit, windowMs: guard.windowMs });

  if (result.allowed) return null;

  const retryAfterSeconds = Math.ceil(result.resetMs / 1000);
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfterSeconds.toString(),
        'X-RateLimit-Limit': guard.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': retryAfterSeconds.toString(),
      },
    },
  );
}

/*
! Preset budgets per route family. Tune as real traffic patterns emerge.
*/
export const RATE_LIMITS = {
  authLogin: { route: 'auth/login', limit: 5, windowMs: 60_000 },
  authRegister: { route: 'auth/register', limit: 3, windowMs: 60_000 },
  favorites: { route: 'favorites', limit: 30, windowMs: 60_000 },
  reviewSubmit: { route: 'review/submit', limit: 60, windowMs: 60_000 },
  chunkReport: { route: 'chunks/report', limit: 5, windowMs: 60_000 },
  feynmanSubmit: { route: 'feynman/submit', limit: 20, windowMs: 60_000 },
  changePassword: { route: 'auth/change-password', limit: 5, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitGuard>;
