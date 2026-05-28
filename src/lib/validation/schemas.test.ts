import { describe, it, expect } from 'vitest';
import {
  sessionPayloadSchema,
  loginSchema,
  registerSchema,
  favoriteSchema,
  reviewSubmitSchema,
  chunkReportSchema,
} from './schemas';

describe('sessionPayloadSchema', () => {
  const valid = { userId: 1, username: 'alice', expiresAt: Date.now() + 60_000 };

  it('accepts a valid session payload', () => {
    const result = sessionPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe(1);
      expect(result.data.username).toBe('alice');
      expect(typeof result.data.expiresAt).toBe('number');
    }
  });

  it('rejects when userId is a string', () => {
    expect(sessionPayloadSchema.safeParse({ ...valid, userId: '1' }).success).toBe(false);
  });

  it('rejects when userId is zero or negative', () => {
    expect(sessionPayloadSchema.safeParse({ ...valid, userId: 0 }).success).toBe(false);
    expect(sessionPayloadSchema.safeParse({ ...valid, userId: -5 }).success).toBe(false);
  });

  it('rejects when expiresAt is absent', () => {
    const { expiresAt: _, ...noExpiry } = valid;
    expect(sessionPayloadSchema.safeParse(noExpiry).success).toBe(false);
  });

  it('rejects when username is empty', () => {
    expect(sessionPayloadSchema.safeParse({ ...valid, username: '' }).success).toBe(false);
  });

  it('rejects non-object payloads', () => {
    expect(sessionPayloadSchema.safeParse(null).success).toBe(false);
    expect(sessionPayloadSchema.safeParse('garbage').success).toBe(false);
    expect(sessionPayloadSchema.safeParse(42).success).toBe(false);
  });
});

const CAPTCHA_ID = '11111111-1111-4111-8111-111111111111';
const captcha = { captchaId: CAPTCHA_ID, captchaAnswer: 7 };

describe('loginSchema', () => {
  it('accepts a well-formed payload', () => {
    expect(loginSchema.safeParse({ username: 'alice', password: 'pw', ...captcha }).success).toBe(true);
  });

  it('rejects empty username', () => {
    expect(loginSchema.safeParse({ username: '', password: 'pw', ...captcha }).success).toBe(false);
  });

  it('trims whitespace from username', () => {
    const result = loginSchema.safeParse({ username: '  alice  ', password: 'pw', ...captcha });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.username).toBe('alice');
  });

  it('rejects missing captcha fields', () => {
    expect(loginSchema.safeParse({ username: 'alice', password: 'pw' }).success).toBe(false);
  });

  it('rejects when honeypot is filled', () => {
    expect(
      loginSchema.safeParse({ username: 'alice', password: 'pw', ...captcha, honeypot: 'bot@example.com' }).success
    ).toBe(false);
  });
});

describe('registerSchema', () => {
  it('enforces minimum username length of 3', () => {
    expect(registerSchema.safeParse({ username: 'ab', password: 'pw12', ...captcha }).success).toBe(false);
    expect(registerSchema.safeParse({ username: 'abc', password: 'pw12', ...captcha }).success).toBe(true);
  });

  it('enforces minimum password length of 4', () => {
    expect(registerSchema.safeParse({ username: 'alice', password: 'abc', ...captcha }).success).toBe(false);
    expect(registerSchema.safeParse({ username: 'alice', password: 'abcd', ...captcha }).success).toBe(true);
  });
});

describe('favoriteSchema', () => {
  it('accepts positive integers', () => {
    expect(favoriteSchema.safeParse({ chunkId: 42 }).success).toBe(true);
  });

  it('coerces numeric strings', () => {
    const result = favoriteSchema.safeParse({ chunkId: '42' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.chunkId).toBe(42);
  });

  it('rejects zero and negatives', () => {
    expect(favoriteSchema.safeParse({ chunkId: 0 }).success).toBe(false);
    expect(favoriteSchema.safeParse({ chunkId: -1 }).success).toBe(false);
  });

  it('rejects non-numeric values', () => {
    expect(favoriteSchema.safeParse({ chunkId: 'abc' }).success).toBe(false);
    expect(favoriteSchema.safeParse({}).success).toBe(false);
  });
});

describe('reviewSubmitSchema', () => {
  it('accepts quality 0..5', () => {
    for (let q = 0; q <= 5; q++) {
      expect(reviewSubmitSchema.safeParse({ chunkId: 1, quality: q }).success).toBe(true);
    }
  });

  it('rejects quality out of range', () => {
    expect(reviewSubmitSchema.safeParse({ chunkId: 1, quality: 6 }).success).toBe(false);
    expect(reviewSubmitSchema.safeParse({ chunkId: 1, quality: -1 }).success).toBe(false);
  });
});

describe('chunkReportSchema', () => {
  it('trims and accepts a valid reason', () => {
    const result = chunkReportSchema.safeParse({ chunkId: 1, reason: '  bad meaning  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reason).toBe('bad meaning');
  });

  it('rejects empty reason after trimming', () => {
    expect(chunkReportSchema.safeParse({ chunkId: 1, reason: '   ' }).success).toBe(false);
  });

  it('rejects reasons longer than 500 chars', () => {
    const long = 'x'.repeat(501);
    expect(chunkReportSchema.safeParse({ chunkId: 1, reason: long }).success).toBe(false);
  });
});
