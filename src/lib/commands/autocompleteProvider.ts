import { db } from '@/lib/db/sqlite';
import { listTagHandlers, listCommandHandlers } from './commandEngine';
import { resolveRelativeDate } from './grammar';

export interface AutocompleteSuggestion {
  label: string;
  description: string;
  insertText: string;
  type: 'date' | 'relative' | 'tag' | 'entity' | 'command' | 'wikilink' | 'hashtag';
}

const RELATIVE_KEYWORDS = [
  { keyword: 'hoje', label: 'hoje', description: () => resolveRelativeDate('hoje') },
  { keyword: 'ontem', label: 'ontem', description: () => resolveRelativeDate('ontem') },
  { keyword: 'amanha', label: 'amanhã', description: () => resolveRelativeDate('amanha') },
  { keyword: 'semana-passada', label: 'semana-passada', description: () => resolveRelativeDate('semana-passada') },
];

/*
? Returns autocomplete suggestions based on the current cursor prefix.
? prefix: the text immediately before the cursor (e.g. "@fei", "[[Red", "#est")
? userId: for user-scoped suggestions (tags, wikilinks)
*/
export function getSuggestions(prefix: string, userId: number): AutocompleteSuggestion[] {
  if (prefix.startsWith('@')) {
    return getAtSuggestions(prefix.slice(1), userId);
  }
  if (prefix.startsWith('[[')) {
    return getWikilinkSuggestions(prefix.slice(2), userId);
  }
  if (prefix.startsWith('#')) {
    return getHashtagSuggestions(prefix.slice(1), userId);
  }
  if (prefix.startsWith('/')) {
    return getCommandSuggestions(prefix.slice(1));
  }
  return [];
}

function getAtSuggestions(partial: string, userId: number): AutocompleteSuggestion[] {
  const suggestions: AutocompleteSuggestion[] = [];

  // Relative dates
  for (const rel of RELATIVE_KEYWORDS) {
    if (rel.keyword.startsWith(partial.toLowerCase())) {
      suggestions.push({
        label: `@${rel.label}`,
        description: rel.description(),
        insertText: `@${rel.keyword}`,
        type: 'relative',
      });
    }
  }

  // Semantic tag handlers
  for (const { tag, description } of listTagHandlers()) {
    if (tag.startsWith(partial.toLowerCase())) {
      suggestions.push({
        label: `@${tag}:`,
        description,
        insertText: `@${tag}: `,
        type: 'tag',
      });
    }
  }

  // Recent journal entry dates
  const recentDates = db
    .prepare(`
      SELECT DISTINCT date FROM study_sessions
      WHERE user_id = ?
      ORDER BY date DESC LIMIT 5
    `)
    .all(userId) as Array<{ date: string }>;

  for (const { date } of recentDates) {
    if (date.includes(partial)) {
      suggestions.push({
        label: `@${date}`,
        description: 'Data de sessão',
        insertText: `@${date}`,
        type: 'date',
      });
    }
  }

  return suggestions.slice(0, 10);
}

function getWikilinkSuggestions(partial: string, _userId: number): AutocompleteSuggestion[] {
  if (partial.length < 2) return [];

  const rows = db
    .prepare(`
      SELECT title, entity_type FROM search_index
      WHERE title MATCH ? AND (user_id = 0 OR user_id = ?)
      LIMIT 8
    `)
    .all(`"${partial}"*`, _userId) as Array<{ title: string; entity_type: string }>;

  return rows.map((r) => ({
    label: `[[${r.title}]]`,
    description: r.entity_type,
    insertText: `[[${r.title}]]`,
    type: 'wikilink' as const,
  }));
}

function getHashtagSuggestions(partial: string, userId: number): AutocompleteSuggestion[] {
  if (partial.length < 1) return [];

  // Tags from existing chunks spacing_tag and search_index tags
  const rows = db
    .prepare(`
      SELECT DISTINCT tags FROM search_index
      WHERE tags LIKE ? AND (user_id = 0 OR user_id = ?)
      LIMIT 10
    `)
    .all(`%${partial}%`, userId) as Array<{ tags: string }>;

  const tagSet = new Set<string>();
  for (const row of rows) {
    for (const tag of row.tags.split(/[\s,]+/)) {
      if (tag.toLowerCase().includes(partial.toLowerCase())) {
        tagSet.add(tag);
      }
    }
  }

  return Array.from(tagSet)
    .slice(0, 8)
    .map((tag) => ({
      label: `#${tag}`,
      description: 'Hashtag existente',
      insertText: `#${tag}`,
      type: 'hashtag' as const,
    }));
}

function getCommandSuggestions(partial: string): AutocompleteSuggestion[] {
  return listCommandHandlers()
    .filter(({ command }) => command.startsWith(partial.toLowerCase()))
    .map(({ command, description }) => ({
      label: `/${command}`,
      description,
      insertText: `/${command} `,
      type: 'command' as const,
    }));
}
