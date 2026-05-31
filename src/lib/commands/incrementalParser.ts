import { TOKEN_PATTERNS, resolveRelativeDate, type ParsedToken, type TokenType } from './grammar';

/*
! Incremental line-by-line parser for the DSL.
! Tokenizes a single line (cursor position context).
! Returns array of ParsedToken for that line.
! Performance target: < 10ms for 10k char document (line-by-line, not full re-parse).
*/

/*
? Splits a line into candidate token spans based on trigger characters (@, #, [[, /).
? Non-token text becomes plain 'text' tokens.
*/
function splitLineIntoSpans(line: string): Array<{ raw: string; start: number }> {
  const spans: Array<{ raw: string; start: number }> = [];
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    if (ch === '@' || ch === '#') {
      // Read until whitespace or end
      let j = i + 1;
      while (j < line.length && !/\s/.test(line[j])) j++;
      spans.push({ raw: line.slice(i, j), start: i });
      i = j;
    } else if (ch === '[' && line[i + 1] === '[') {
      // Read until ]]
      const close = line.indexOf(']]', i + 2);
      if (close >= 0) {
        spans.push({ raw: line.slice(i, close + 2), start: i });
        i = close + 2;
      } else {
        // Unclosed — treat as text
        spans.push({ raw: line[i], start: i });
        i++;
      }
    } else if (ch === '/' && (i === 0 || /\s/.test(line[i - 1]))) {
      // Command token — read to end of token
      let j = i + 1;
      while (j < line.length && !/\s/.test(line[j])) j++;
      // Include trailing args (rest of line)
      const rest = line.slice(i);
      spans.push({ raw: rest, start: i });
      i = line.length;
    } else {
      // Accumulate plain text
      let j = i + 1;
      while (j < line.length && !['@', '#', '[', '/'].includes(line[j])) j++;
      spans.push({ raw: line.slice(i, j), start: i });
      i = j;
    }
  }

  return spans;
}

function classifyToken(span: { raw: string; start: number }): ParsedToken {
  const { raw, start } = span;
  const end = start + raw.length;
  const pos = { start, end };

  if (TOKEN_PATTERNS.DATE_REF.test(raw)) {
    const [, date] = TOKEN_PATTERNS.DATE_REF.exec(raw)!;
    return { type: 'date_ref', raw, value: date, position: pos, status: 'resolved' };
  }

  if (TOKEN_PATTERNS.RELATIVE_REF.test(raw)) {
    const [, keyword] = TOKEN_PATTERNS.RELATIVE_REF.exec(raw)!;
    return { type: 'relative_ref', raw, value: resolveRelativeDate(keyword), extra: keyword, position: pos, status: 'resolved' };
  }

  // ENTITY_REF checked before SEMANTIC_TAG — it is more specific (@book|chunk|note|goal prefix)
  if (TOKEN_PATTERNS.ENTITY_REF.test(raw)) {
    const [, entityType, identifier] = TOKEN_PATTERNS.ENTITY_REF.exec(raw)!;
    return { type: 'entity_ref', raw, value: entityType.toLowerCase(), extra: identifier, position: pos, status: 'pending' };
  }

  if (TOKEN_PATTERNS.SEMANTIC_TAG.test(raw)) {
    const [, tag, text] = TOKEN_PATTERNS.SEMANTIC_TAG.exec(raw)!;
    return { type: 'semantic_tag', raw, value: tag.toLowerCase(), extra: text.trim(), position: pos, status: 'pending' };
  }

  if (TOKEN_PATTERNS.WIKILINK.test(raw)) {
    const [, title] = TOKEN_PATTERNS.WIKILINK.exec(raw)!;
    return { type: 'wikilink', raw, value: title, position: pos, status: 'pending' };
  }

  if (TOKEN_PATTERNS.HASHTAG.test(raw)) {
    const [, tag] = TOKEN_PATTERNS.HASHTAG.exec(raw)!;
    return { type: 'hashtag', raw, value: tag.toLowerCase(), position: pos, status: 'resolved' };
  }

  if (TOKEN_PATTERNS.COMMAND.test(raw)) {
    const [, cmd, args] = TOKEN_PATTERNS.COMMAND.exec(raw)!;
    return { type: 'command', raw, value: cmd.toLowerCase(), extra: args ?? '', position: pos, status: 'pending' };
  }

  return { type: 'text', raw, value: raw, position: pos, status: 'resolved' };
}

export function parseLine(line: string): ParsedToken[] {
  return splitLineIntoSpans(line).map(classifyToken);
}

export function parseDocument(text: string): ParsedToken[][] {
  return text.split('\n').map(parseLine);
}
