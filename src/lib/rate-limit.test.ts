import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T12:00:00Z'));
  });

  it('allows requests up to the limit', () => {
    const cfg = { limit: 3, windowMs: 60_000 };
    expect(checkRateLimit('test:a', cfg).allowed).toBe(true);
    expect(checkRateLimit('test:a', cfg).allowed).toBe(true);
    expect(checkRateLimit('test:a', cfg).allowed).toBe(true);
    expect(checkRateLimit('test:a', cfg).allowed).toBe(false);
  });

  it('keeps separate budgets per key', () => {
    const cfg = { limit: 1, windowMs: 60_000 };
    expect(checkRateLimit('test:b', cfg).allowed).toBe(true);
    expect(checkRateLimit('test:b', cfg).allowed).toBe(false);
    expect(checkRateLimit('test:c', cfg).allowed).toBe(true);
  });

  it('refills the bucket after the window elapses', () => {
    const cfg = { limit: 2, windowMs: 60_000 };
    expect(checkRateLimit('test:d', cfg).allowed).toBe(true);
    expect(checkRateLimit('test:d', cfg).allowed).toBe(true);
    expect(checkRateLimit('test:d', cfg).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit('test:d', cfg).allowed).toBe(true);
  });

  it('reports remaining tokens and reset time', () => {
    const cfg = { limit: 5, windowMs: 60_000 };
    const r1 = checkRateLimit('test:e', cfg);
    expect(r1.remaining).toBe(4);
    expect(r1.resetMs).toBeLessThanOrEqual(60_000);
  });
});
