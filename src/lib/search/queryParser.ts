/*
! Search DSL parser — shared between global search (#94) and text command engine (#98).
! Supports: free text, field filters (type:chunk), domain filter (domain:backend),
!           period filter (period:last7d last30d), tag filter (tag:python).
*/

export type EntityType = 'chunk' | 'book' | 'journal_entry' | 'book_highlight';

export interface ParsedSearchQuery {
  freeText: string;
  filters: {
    types: EntityType[];
    domains: string[];
    tags: string[];
    period: PeriodFilter | null;
  };
}

export type PeriodFilter =
  | { kind: 'last_n_days'; days: number }
  | { kind: 'month'; year: number; month: number };

const PERIOD_PRESETS: Record<string, number> = {
  last7d: 7,
  last30d: 30,
  last90d: 90,
  last1y: 365,
};

function parsePeriod(value: string): PeriodFilter | null {
  if (PERIOD_PRESETS[value]) {
    return { kind: 'last_n_days', days: PERIOD_PRESETS[value] };
  }
  // YYYY-MM format
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(value);
  if (monthMatch) {
    return { kind: 'month', year: parseInt(monthMatch[1]), month: parseInt(monthMatch[2]) };
  }
  return null;
}

const ENTITY_TYPES = new Set<EntityType>(['chunk', 'book', 'journal_entry', 'book_highlight']);

/*
? Parses a search query string into structured filters + free text.
? Example: "redis type:chunk domain:backend tag:estudo period:last30d"
*/
export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const types: EntityType[] = [];
  const domains: string[] = [];
  const tags: string[] = [];
  let period: PeriodFilter | null = null;
  const freeTextParts: string[] = [];

  const tokens = raw.trim().split(/\s+/);

  for (const token of tokens) {
    const colonIdx = token.indexOf(':');
    if (colonIdx > 0) {
      const key = token.slice(0, colonIdx).toLowerCase();
      const value = token.slice(colonIdx + 1);

      if (key === 'type' && ENTITY_TYPES.has(value as EntityType)) {
        types.push(value as EntityType);
        continue;
      }
      if (key === 'domain') {
        domains.push(value);
        continue;
      }
      if (key === 'tag') {
        tags.push(value);
        continue;
      }
      if (key === 'period') {
        period = parsePeriod(value);
        continue;
      }
    }
    freeTextParts.push(token);
  }

  return {
    freeText: freeTextParts.join(' '),
    filters: { types, domains, tags, period },
  };
}

/*
? Converts free text to FTS5 trigram query.
? Each word gets * prefix matching. Returns empty-match query for blank input.
*/
export function toFtsQuery(freeText: string): string {
  const sanitized = freeText.replace(/["'()*+\-:^~{}[\]|]/g, ' ').trim();
  if (!sanitized) return '""';
  return sanitized
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `"${w}"`)
    .join(' OR ');
}

/*
? Converts period filter to unix timestamp range [fromTs, toTs].
*/
export function periodToRange(period: PeriodFilter): { fromTs: number; toTs: number } {
  const now = Math.floor(Date.now() / 1000);
  if (period.kind === 'last_n_days') {
    return { fromTs: now - period.days * 86400, toTs: now };
  }
  const start = new Date(period.year, period.month - 1, 1);
  const end = new Date(period.year, period.month, 1);
  return {
    fromTs: Math.floor(start.getTime() / 1000),
    toTs: Math.floor(end.getTime() / 1000),
  };
}
