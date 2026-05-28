import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  favoriteSchema,
  reviewSubmitSchema,
  chunkReportSchema,
} from './schemas';

describe('loginSchema', () => {
  it('accepts a well-formed payload', () => {
    expect(loginSchema.safeParse({ username: 'alice', password: 'pw' }).success).toBe(true);
  });

  it('rejects empty username', () => {
    expect(loginSchema.safeParse({ username: '', password: 'pw' }).success).toBe(false);
  });

  it('trims whitespace from username', () => {
    const result = loginSchema.safeParse({ username: '  alice  ', password: 'pw' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.username).toBe('alice');
  });
});

describe('registerSchema', () => {
  it('enforces minimum username length of 3', () => {
    expect(registerSchema.safeParse({ username: 'ab', password: 'pw12' }).success).toBe(false);
    expect(registerSchema.safeParse({ username: 'abc', password: 'pw12' }).success).toBe(true);
  });

  it('enforces minimum password length of 4', () => {
    expect(registerSchema.safeParse({ username: 'alice', password: 'abc' }).success).toBe(false);
    expect(registerSchema.safeParse({ username: 'alice', password: 'abcd' }).success).toBe(true);
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
