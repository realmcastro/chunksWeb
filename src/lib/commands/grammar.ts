/*
! DSL grammar definitions for the text command engine.
! Token types and regex patterns for the inline parser.
*/

export const TOKEN_PATTERNS = {
  // @2026-05-31
  DATE_REF: /^@(\d{4}-\d{2}-\d{2})$/,
  // @ontem @semana-passada @proximo-mes
  RELATIVE_REF: /^@(hoje|ontem|amanha|semana-passada|proxima-semana|mes-passado|proximo-mes|this-week|last-week|next-week|yesterday|today|tomorrow)$/i,
  // @feito: texto
  SEMANTIC_TAG: /^@([a-z][a-z0-9-]*):(.*)$/i,
  // @book:Clean-Code @chunk:42
  ENTITY_REF: /^@(book|chunk|note|goal):(.+)$/i,
  // [[wikilink]]
  WIKILINK: /^\[\[(.+)\]\]$/,
  // #hashtag
  HASHTAG: /^#([a-z0-9_-]+)$/i,
  // /command args
  COMMAND: /^\/([a-z][a-z0-9-]*)(?:\s+(.*))?$/i,
} as const;

export type TokenType =
  | 'date_ref'
  | 'relative_ref'
  | 'semantic_tag'
  | 'entity_ref'
  | 'wikilink'
  | 'hashtag'
  | 'command'
  | 'text';

export interface ParsedToken {
  type: TokenType;
  raw: string;
  value: string;
  extra?: string;
  position: { start: number; end: number };
  status: 'resolved' | 'broken' | 'pending';
}

export const RELATIVE_DATE_MAP: Record<string, number> = {
  hoje: 0,
  today: 0,
  ontem: -1,
  yesterday: -1,
  amanha: 1,
  tomorrow: 1,
  'semana-passada': -7,
  'last-week': -7,
  'proxima-semana': 7,
  'next-week': 7,
  'mes-passado': -30,
  'proximo-mes': 30,
};

export function resolveRelativeDate(keyword: string): string {
  const offset = RELATIVE_DATE_MAP[keyword.toLowerCase()] ?? 0;
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}
