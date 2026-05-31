import { describe, it, expect } from 'vitest';
import { parseSearchQuery, toFtsQuery, periodToRange } from '../queryParser';

describe('parseSearchQuery', () => {
  it('parses free text only', () => {
    const result = parseSearchQuery('redis distributed');
    expect(result.freeText).toBe('redis distributed');
    expect(result.filters.types).toHaveLength(0);
    expect(result.filters.domains).toHaveLength(0);
    expect(result.filters.period).toBeNull();
  });

  it('parses type:chunk filter', () => {
    const result = parseSearchQuery('redis type:chunk');
    expect(result.freeText).toBe('redis');
    expect(result.filters.types).toEqual(['chunk']);
  });

  it('parses all valid entity types', () => {
    const types = ['chunk', 'book', 'journal_entry', 'book_highlight'] as const;
    for (const type of types) {
      const result = parseSearchQuery(`test type:${type}`);
      expect(result.filters.types).toContain(type);
    }
  });

  it('unknown type value stays as free text', () => {
    const result = parseSearchQuery('type:unknown_type');
    expect(result.freeText).toBe('type:unknown_type');
    expect(result.filters.types).toHaveLength(0);
  });

  it('parses domain filter', () => {
    const result = parseSearchQuery('redis domain:backend');
    expect(result.freeText).toBe('redis');
    expect(result.filters.domains).toEqual(['backend']);
  });

  it('parses tag filter', () => {
    const result = parseSearchQuery('algo tag:python');
    expect(result.freeText).toBe('algo');
    expect(result.filters.tags).toEqual(['python']);
  });

  it('parses period:last7d', () => {
    const result = parseSearchQuery('notes period:last7d');
    expect(result.freeText).toBe('notes');
    expect(result.filters.period).toEqual({ kind: 'last_n_days', days: 7 });
  });

  it('parses period:last30d', () => {
    const result = parseSearchQuery('period:last30d');
    expect(result.filters.period).toEqual({ kind: 'last_n_days', days: 30 });
    expect(result.freeText).toBe('');
  });

  it('parses period:last90d and period:last1y', () => {
    expect(parseSearchQuery('period:last90d').filters.period).toEqual({ kind: 'last_n_days', days: 90 });
    expect(parseSearchQuery('period:last1y').filters.period).toEqual({ kind: 'last_n_days', days: 365 });
  });

  it('parses period YYYY-MM format', () => {
    const result = parseSearchQuery('journal period:2026-05');
    expect(result.freeText).toBe('journal');
    expect(result.filters.period).toEqual({ kind: 'month', year: 2026, month: 5 });
  });

  it('unknown period value: consumed as period token, period stays null', () => {
    const result = parseSearchQuery('period:invalid');
    expect(result.freeText).toBe('');
    expect(result.filters.period).toBeNull();
  });

  it('parses multiple filters combined', () => {
    const result = parseSearchQuery('redis type:chunk domain:backend tag:infra period:last30d');
    expect(result.freeText).toBe('redis');
    expect(result.filters.types).toEqual(['chunk']);
    expect(result.filters.domains).toEqual(['backend']);
    expect(result.filters.tags).toEqual(['infra']);
    expect(result.filters.period).toEqual({ kind: 'last_n_days', days: 30 });
  });

  it('handles empty input', () => {
    const result = parseSearchQuery('');
    expect(result.freeText).toBe('');
    expect(result.filters.types).toHaveLength(0);
    expect(result.filters.period).toBeNull();
  });

  it('handles extra whitespace', () => {
    const result = parseSearchQuery('  redis  ');
    expect(result.freeText).toBe('redis');
  });
});

describe('toFtsQuery', () => {
  it('wraps single word in double quotes', () => {
    expect(toFtsQuery('redis')).toBe('"redis"');
  });

  it('joins multi-word with OR', () => {
    expect(toFtsQuery('redis cluster')).toBe('"redis" OR "cluster"');
  });

  it('strips FTS5 special chars (all replaced with space, then split)', () => {
    // *, +, " all become spaces → each segment is a separate quoted word
    expect(toFtsQuery('hello*world')).toBe('"hello" OR "world"');
    expect(toFtsQuery('a+b')).toBe('"a" OR "b"');
    expect(toFtsQuery('test"query')).toBe('"test" OR "query"');
  });

  it('returns empty-match for blank input', () => {
    expect(toFtsQuery('')).toBe('""');
    expect(toFtsQuery('   ')).toBe('""');
  });

  it('handles multi-word with special chars', () => {
    const result = toFtsQuery('hello (world)');
    expect(result).toBe('"hello" OR "world"');
  });
});

describe('periodToRange', () => {
  it('last_n_days: fromTs is approximately now minus n days', () => {
    const before = Math.floor(Date.now() / 1000);
    const { fromTs, toTs } = periodToRange({ kind: 'last_n_days', days: 7 });
    const after = Math.floor(Date.now() / 1000);

    expect(toTs).toBeGreaterThanOrEqual(before);
    expect(toTs).toBeLessThanOrEqual(after);
    expect(toTs - fromTs).toBeCloseTo(7 * 86400, -1);
  });

  it('month: fromTs is first of month, toTs is first of next month', () => {
    const { fromTs, toTs } = periodToRange({ kind: 'month', year: 2026, month: 5 });
    const from = new Date(fromTs * 1000);
    const to = new Date(toTs * 1000);

    expect(from.getUTCFullYear()).toBe(2026);
    expect(from.getUTCMonth()).toBe(4); // 0-indexed May
    expect(from.getUTCDate()).toBe(1);
    expect(to.getUTCMonth()).toBe(5); // June
    expect(to.getUTCDate()).toBe(1);
  });

  it('month December wraps to January of next year', () => {
    const { fromTs, toTs } = periodToRange({ kind: 'month', year: 2025, month: 12 });
    const to = new Date(toTs * 1000);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(0); // January 0-indexed
  });
});
