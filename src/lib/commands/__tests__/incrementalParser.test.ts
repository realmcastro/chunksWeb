import { describe, it, expect } from 'vitest';
import { parseLine, parseDocument } from '../incrementalParser';

describe('parseLine', () => {
  it('returns text token for plain text', () => {
    const tokens = parseLine('hello world');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('text');
    expect(tokens[0].value).toBe('hello world');
    expect(tokens[0].status).toBe('resolved');
  });

  it('returns empty array for empty string', () => {
    expect(parseLine('')).toHaveLength(0);
  });

  it('parses date ref @2026-05-31', () => {
    const tokens = parseLine('@2026-05-31');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('date_ref');
    expect(tokens[0].value).toBe('2026-05-31');
    expect(tokens[0].raw).toBe('@2026-05-31');
    expect(tokens[0].status).toBe('resolved');
  });

  it('parses relative ref @hoje', () => {
    const tokens = parseLine('@hoje');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('relative_ref');
    expect(tokens[0].extra).toBe('hoje');
    expect(tokens[0].status).toBe('resolved');
  });

  it('parses entity ref @chunk:42 (ENTITY_REF takes priority over SEMANTIC_TAG)', () => {
    const tokens = parseLine('@chunk:42');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('entity_ref');
    expect(tokens[0].value).toBe('chunk');
    expect(tokens[0].extra).toBe('42');
    expect(tokens[0].status).toBe('pending');
  });

  it('parses semantic tag @feito:texto (non-entity prefix)', () => {
    const tokens = parseLine('@feito:texto');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('semantic_tag');
    expect(tokens[0].value).toBe('feito');
    expect(tokens[0].extra).toBe('texto');
    expect(tokens[0].status).toBe('pending');
  });

  it('parses wikilink [[Redis Cluster]]', () => {
    const tokens = parseLine('[[Redis Cluster]]');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('wikilink');
    expect(tokens[0].value).toBe('Redis Cluster');
    expect(tokens[0].status).toBe('pending');
  });

  it('parses hashtag #python', () => {
    const tokens = parseLine('#python');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('hashtag');
    expect(tokens[0].value).toBe('python');
    expect(tokens[0].status).toBe('resolved');
  });

  it('parses /command with args (entire line as command span)', () => {
    const tokens = parseLine('/template daily review');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('command');
    expect(tokens[0].value).toBe('template');
    expect(tokens[0].extra).toBe('daily review');
    expect(tokens[0].status).toBe('pending');
  });

  it('parses /command with no args', () => {
    const tokens = parseLine('/done');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('command');
    expect(tokens[0].value).toBe('done');
    expect(tokens[0].extra).toBe('');
  });

  it('records correct positions', () => {
    const tokens = parseLine('@hoje texto');
    const relToken = tokens.find((t) => t.type === 'relative_ref');
    expect(relToken?.position.start).toBe(0);
    expect(relToken?.position.end).toBe(5); // '@hoje' = 5 chars
  });

  it('position of second token starts after first', () => {
    const tokens = parseLine('#redis #python');
    expect(tokens[0].position.start).toBe(0);
    // '#redis' = 6 chars, then ' ', then '#python' at 7
    expect(tokens.find((t) => t.value === 'python')?.position.start).toBe(7);
  });

  it('handles unclosed [[ as text tokens', () => {
    const tokens = parseLine('[[unclosed');
    expect(tokens.every((t) => t.type !== 'wikilink')).toBe(true);
    expect(tokens.some((t) => t.type === 'text')).toBe(true);
  });

  it('parses mixed line: text + hashtag + semantic_tag', () => {
    const tokens = parseLine('Learned #redis @feito:studied today');
    const types = tokens.map((t) => t.type);
    expect(types).toContain('text');
    expect(types).toContain('hashtag');
    expect(types).toContain('semantic_tag');
  });

  it('semantic tag normalizes to lowercase', () => {
    const tokens = parseLine('@META:goal');
    expect(tokens[0].type).toBe('semantic_tag');
    expect(tokens[0].value).toBe('meta');
  });

  it('hashtag normalizes to lowercase', () => {
    const tokens = parseLine('#PYTHON');
    expect(tokens[0].value).toBe('python');
  });

  it('entity ref normalizes entityType to lowercase', () => {
    const tokens = parseLine('@CHUNK:42');
    expect(tokens[0].type).toBe('entity_ref');
    expect(tokens[0].value).toBe('chunk');
  });
});

describe('parseDocument', () => {
  it('splits on newlines and parses each line', () => {
    const doc = parseDocument('@hoje\n#python\nplain text');
    expect(doc).toHaveLength(3);
    expect(doc[0][0].type).toBe('relative_ref');
    expect(doc[1][0].type).toBe('hashtag');
    expect(doc[2][0].type).toBe('text');
  });

  it('empty lines produce empty arrays', () => {
    const doc = parseDocument('a\n\nb');
    expect(doc[1]).toHaveLength(0);
  });

  it('single-line document works', () => {
    const doc = parseDocument('#redis');
    expect(doc).toHaveLength(1);
    expect(doc[0][0].type).toBe('hashtag');
  });
});
