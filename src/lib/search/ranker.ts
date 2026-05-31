import { db } from '@/lib/db/sqlite';
import type { ParsedSearchQuery, EntityType } from './queryParser';
import { toFtsQuery, periodToRange } from './queryParser';

export interface SearchResult {
  type: EntityType;
  id: string;
  title: string;
  snippet: string;
  domain: string;
  score: number;
}

interface RawSearchRow {
  entity_type: string;
  entity_id: string;
  domain_slug: string;
  title: string;
  body: string;
  rank: number;
}

/*
? Returns normalized snippet: first 160 chars of body, trimmed at word boundary.
*/
function makeSnippet(body: string): string {
  if (body.length <= 160) return body;
  const cut = body.slice(0, 160);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + '…';
}

/*
! Cross-module search over search_index FTS5 table.
! Filters applied in WHERE clause for efficiency.
! Score: FTS5 rank (negative float — lower = more relevant).
*/
export function search(
  query: ParsedSearchQuery,
  userId: number,
  limit = 20,
  offset = 0,
): SearchResult[] {
  const ftsQuery = toFtsQuery(query.freeText);

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  // FTS5 match (skip if query is just filters with no free text)
  const hasFreeText = query.freeText.trim().length > 0;
  if (hasFreeText) {
    conditions.push('search_index MATCH ?');
    params.push(ftsQuery);
  }

  // User filter: own content OR system content (user_id=0)
  conditions.push('(user_id = 0 OR user_id = ?)');
  params.push(userId);

  if (query.filters.types.length > 0) {
    const placeholders = query.filters.types.map(() => '?').join(',');
    conditions.push(`entity_type IN (${placeholders})`);
    params.push(...query.filters.types);
  }

  if (query.filters.domains.length > 0) {
    const placeholders = query.filters.domains.map(() => '?').join(',');
    conditions.push(`domain_slug IN (${placeholders})`);
    params.push(...query.filters.domains);
  }

  if (query.filters.period) {
    const { fromTs, toTs } = periodToRange(query.filters.period);
    conditions.push('indexed_at >= ? AND indexed_at <= ?');
    params.push(fromTs, toTs);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = hasFreeText ? 'ORDER BY rank' : 'ORDER BY indexed_at DESC';

  const rows = db
    .prepare(`
      SELECT entity_type, entity_id, domain_slug, title, body, rank
      FROM search_index
      ${where}
      ${orderBy}
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset) as RawSearchRow[];

  return rows.map((row, i) => ({
    type: row.entity_type as EntityType,
    id: row.entity_id,
    title: row.title,
    snippet: makeSnippet(row.body),
    domain: row.domain_slug,
    // Normalize rank to 0-1 score (FTS5 rank is negative; row order = relevance proxy)
    score: parseFloat((1 - i / Math.max(rows.length, 1)).toFixed(2)),
  }));
}
