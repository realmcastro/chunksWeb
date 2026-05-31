import { describe, it, expect } from 'vitest';
import { TOKEN_PATTERNS, resolveRelativeDate, RELATIVE_DATE_MAP } from '../grammar';

describe('TOKEN_PATTERNS.DATE_REF', () => {
  it('matches ISO date prefixed with @', () => {
    expect(TOKEN_PATTERNS.DATE_REF.test('@2026-05-31')).toBe(true);
  });

  it('captures the date portion', () => {
    const m = TOKEN_PATTERNS.DATE_REF.exec('@2026-05-31');
    expect(m?.[1]).toBe('2026-05-31');
  });

  it('does not match without @', () => {
    expect(TOKEN_PATTERNS.DATE_REF.test('2026-05-31')).toBe(false);
  });

  it('does not match partial date (@YYYY-MM)', () => {
    expect(TOKEN_PATTERNS.DATE_REF.test('@2026-05')).toBe(false);
  });

  it('does not match @YYYY-MM-DDextra', () => {
    // regex is anchored via ^ and $
    expect(TOKEN_PATTERNS.DATE_REF.test('@2026-05-31extra')).toBe(false);
  });
});

describe('TOKEN_PATTERNS.RELATIVE_REF', () => {
  it('matches Portuguese keywords', () => {
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@hoje')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@ontem')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@amanha')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@semana-passada')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@proxima-semana')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@mes-passado')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@proximo-mes')).toBe(true);
  });

  it('matches English keywords', () => {
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@yesterday')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@today')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@tomorrow')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@this-week')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@last-week')).toBe(true);
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@next-week')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@HOJE')).toBe(true);
  });

  it('does not match unknown keyword', () => {
    expect(TOKEN_PATTERNS.RELATIVE_REF.test('@unknownword')).toBe(false);
  });
});

describe('TOKEN_PATTERNS.SEMANTIC_TAG', () => {
  it('matches @feito:texto', () => {
    expect(TOKEN_PATTERNS.SEMANTIC_TAG.test('@feito:texto')).toBe(true);
  });

  it('captures tag and text', () => {
    const m = TOKEN_PATTERNS.SEMANTIC_TAG.exec('@feito:aprendi muito');
    expect(m?.[1]).toBe('feito');
    expect(m?.[2]).toBe('aprendi muito');
  });

  it('does not match @feito (no colon)', () => {
    expect(TOKEN_PATTERNS.SEMANTIC_TAG.test('@feito')).toBe(false);
  });

  it('does not match @1invalid (starts with digit)', () => {
    expect(TOKEN_PATTERNS.SEMANTIC_TAG.test('@1tag:x')).toBe(false);
  });
});

describe('TOKEN_PATTERNS.ENTITY_REF', () => {
  it('matches @chunk:42', () => {
    expect(TOKEN_PATTERNS.ENTITY_REF.test('@chunk:42')).toBe(true);
  });

  it('matches @book:Clean-Code', () => {
    expect(TOKEN_PATTERNS.ENTITY_REF.test('@book:Clean-Code')).toBe(true);
  });

  it('matches @note and @goal', () => {
    expect(TOKEN_PATTERNS.ENTITY_REF.test('@note:123')).toBe(true);
    expect(TOKEN_PATTERNS.ENTITY_REF.test('@goal:456')).toBe(true);
  });

  it('does not match @unknown:42', () => {
    expect(TOKEN_PATTERNS.ENTITY_REF.test('@unknown:42')).toBe(false);
  });
});

describe('TOKEN_PATTERNS.WIKILINK', () => {
  it('matches [[Redis Cluster]]', () => {
    expect(TOKEN_PATTERNS.WIKILINK.test('[[Redis Cluster]]')).toBe(true);
  });

  it('captures inner title', () => {
    const m = TOKEN_PATTERNS.WIKILINK.exec('[[Clean Code]]');
    expect(m?.[1]).toBe('Clean Code');
  });

  it('does not match single brackets [Redis]', () => {
    expect(TOKEN_PATTERNS.WIKILINK.test('[Redis]')).toBe(false);
  });

  it('does not match unclosed [[Redis', () => {
    expect(TOKEN_PATTERNS.WIKILINK.test('[[Redis')).toBe(false);
  });
});

describe('TOKEN_PATTERNS.HASHTAG', () => {
  it('matches #python', () => {
    expect(TOKEN_PATTERNS.HASHTAG.test('#python')).toBe(true);
  });

  it('matches hyphenated #my-tag', () => {
    expect(TOKEN_PATTERNS.HASHTAG.test('#my-tag')).toBe(true);
  });

  it('captures tag name', () => {
    const m = TOKEN_PATTERNS.HASHTAG.exec('#redis');
    expect(m?.[1]).toBe('redis');
  });

  it('does not match bare #', () => {
    expect(TOKEN_PATTERNS.HASHTAG.test('#')).toBe(false);
  });
});

describe('TOKEN_PATTERNS.COMMAND', () => {
  it('matches /template', () => {
    expect(TOKEN_PATTERNS.COMMAND.test('/template')).toBe(true);
  });

  it('matches /template with args', () => {
    expect(TOKEN_PATTERNS.COMMAND.test('/template daily review')).toBe(true);
  });

  it('captures command and args separately', () => {
    const m = TOKEN_PATTERNS.COMMAND.exec('/template daily review');
    expect(m?.[1]).toBe('template');
    expect(m?.[2]).toBe('daily review');
  });

  it('does not match /1invalid (starts with digit)', () => {
    expect(TOKEN_PATTERNS.COMMAND.test('/1invalid')).toBe(false);
  });
});

describe('resolveRelativeDate', () => {
  it('hoje resolves to today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(resolveRelativeDate('hoje')).toBe(today);
  });

  it('today resolves to today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(resolveRelativeDate('today')).toBe(today);
  });

  it('ontem resolves to yesterday', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(resolveRelativeDate('ontem')).toBe(d.toISOString().split('T')[0]);
  });

  it('amanha resolves to tomorrow', () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    expect(resolveRelativeDate('amanha')).toBe(d.toISOString().split('T')[0]);
  });

  it('is case-insensitive (HOJE → today)', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(resolveRelativeDate('HOJE')).toBe(today);
  });

  it('unknown keyword defaults to today (offset 0)', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(resolveRelativeDate('totally-unknown')).toBe(today);
  });

  it('RELATIVE_DATE_MAP contains all expected keywords', () => {
    const expected = ['hoje', 'today', 'ontem', 'yesterday', 'amanha', 'tomorrow', 'semana-passada', 'last-week'];
    for (const kw of expected) {
      expect(RELATIVE_DATE_MAP).toHaveProperty(kw);
    }
  });
});
