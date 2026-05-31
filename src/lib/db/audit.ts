import { db } from './sqlite';

const PAGE_SIZE = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditChunk {
  id: number;
  language: string;
  chunk_text: string;
  meaning: string;
  primary_function: string | null;
  communicative_purpose: string | null;
  trigger_situations: string | null;
  contexts: string | null;
  cefr_level_id: number | null;
  output_priority: string | null;
  frequency: string | null;
  formulaicity: string | null;
  construction_type: string | null;
  acquisition_priority: string | null;
  pattern: string | null;
  core_structure: string | null;
  substitution_slots: string | null;
  typical_collocates: string | null;
  common_substitutions: string | null;
  variations: string | null;
  common_mistakes: string | null;
  similar_contrasting: string | null;
  interference_warnings: string | null;
  nuance: string | null;
  pragmatic_effect: string | null;
  recall_cue: string | null;
  spacing_tag: string | null;
  upgrade_path: string | null;
  chunk_family: string | null;
  is_idiom: number;
  source_file: string;
  category_id: number;
  display_order: number;
}

export interface AuditGrammar {
  id: number;
  language: string;
  structure_label: string;
  core_meaning: string;
  primary_communicative_fn: string | null;
  when_to_use: string | null;
  pattern: string | null;
  key_variations: string | null;
  essential_vocabulary_slots: string | null;
  common_learner_mistakes: string | null;
  chunk_compatibility: string | null;
  primary_function: string | null;
  key_forms: string | null;
  essential_vocabulary: string | null;
  why_it_matters: string | null;
  common_mistakes: string | null;
  source_file: string;
  category_id: number;
}

export interface AuditVocab {
  id: number;
  language: string;
  word: string;
  phonetic: string | null;
  part_of_speech: string | null;
  cefr_level: string | null;
  category: string | null;
  subcategory: string | null;
  article: string | null;
  plural_form: string | null;
  countability: string | null;
  regional_variant: string | null;
  frequency_rank: number | null;
  primary_meaning: string | null;
  secondary_meaning: string | null;
  usage_notes: string | null;
  common_collocations: string | null;
  synonyms: string | null;
  antonyms: string | null;
  image_search_query: string | null;
  image_context: string | null;
  image_tags: string | null;
  example_1: string | null;
  example_1_translation: string | null;
  example_2: string | null;
  example_2_translation: string | null;
  example_3: string | null;
  example_3_translation: string | null;
  pronunciation_tips: string | null;
  memory_hook: string | null;
  related_words: string | null;
  common_mistakes: string | null;
  learning_priority: string | null;
}

export interface AuditExample {
  id: number;
  example_index: number;
  text_en: string;
  text_target: string | null;
  is_canonical: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Chunks
// ---------------------------------------------------------------------------

export function listChunks(
  q: string,
  lang: string,
  page: number,
): PagedResult<AuditChunk> {
  const offset = (page - 1) * PAGE_SIZE;
  const like = `%${q}%`;
  const langFilter = lang === 'all' ? '%' : lang;

  const items = db
    .prepare(
      `SELECT * FROM chunks
       WHERE language LIKE ?
         AND (chunk_text LIKE ? OR meaning LIKE ? OR primary_function LIKE ?)
       ORDER BY id
       LIMIT ? OFFSET ?`,
    )
    .all(langFilter, like, like, like, PAGE_SIZE, offset) as AuditChunk[];

  const { total } = db
    .prepare(
      `SELECT COUNT(*) AS total FROM chunks
       WHERE language LIKE ?
         AND (chunk_text LIKE ? OR meaning LIKE ? OR primary_function LIKE ?)`,
    )
    .get(langFilter, like, like, like) as { total: number };

  return { items, total, page, pageSize: PAGE_SIZE };
}

export function getChunkWithExamples(id: number): {
  chunk: AuditChunk | null;
  examples: AuditExample[];
} {
  const chunk = db
    .prepare('SELECT * FROM chunks WHERE id = ?')
    .get(id) as AuditChunk | null;

  const examples = chunk
    ? (db
        .prepare(
          `SELECT * FROM examples WHERE item_type = 'chunk' AND item_id = ? ORDER BY example_index`,
        )
        .all(id) as AuditExample[])
    : [];

  return { chunk, examples };
}

export function updateChunk(id: number, fields: Partial<AuditChunk>): boolean {
  const allowed = [
    'chunk_text', 'meaning', 'primary_function', 'communicative_purpose',
    'trigger_situations', 'contexts', 'cefr_level_id', 'output_priority',
    'frequency', 'formulaicity', 'construction_type', 'acquisition_priority',
    'pattern', 'core_structure', 'substitution_slots', 'typical_collocates',
    'common_substitutions', 'variations', 'common_mistakes', 'similar_contrasting',
    'interference_warnings', 'nuance', 'pragmatic_effect', 'recall_cue',
    'spacing_tag', 'upgrade_path', 'chunk_family', 'is_idiom', 'language',
    'category_id', 'display_order',
  ];

  const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (updates.length === 0) return false;

  const now = Math.floor(Date.now() / 1000);
  const setClauses = updates.map(([k]) => `${k} = ?`).join(', ');
  const values = updates.map(([, v]) => v);

  const result = db
    .prepare(`UPDATE chunks SET ${setClauses}, updated_at = ? WHERE id = ?`)
    .run(...values, now, id);

  return result.changes > 0;
}

export function upsertChunkExamples(
  chunkId: number,
  examples: { text_en: string; text_target?: string; index: number }[],
): void {
  const del = db.prepare(
    `DELETE FROM examples WHERE item_type = 'chunk' AND item_id = ?`,
  );
  const ins = db.prepare(
    `INSERT INTO examples (item_type, item_id, example_index, text_en, text_target, is_canonical)
     VALUES ('chunk', ?, ?, ?, ?, ?)`,
  );

  const tx = db.transaction(() => {
    del.run(chunkId);
    for (const ex of examples) {
      if (ex.text_en?.trim()) {
        ins.run(chunkId, ex.index, ex.text_en, ex.text_target || null, ex.index === 1 ? 1 : 0);
      }
    }
  });
  tx();
}

// ---------------------------------------------------------------------------
// Grammar
// ---------------------------------------------------------------------------

export function listGrammar(
  q: string,
  lang: string,
  page: number,
): PagedResult<AuditGrammar> {
  const offset = (page - 1) * PAGE_SIZE;
  const like = `%${q}%`;
  const langFilter = lang === 'all' ? '%' : lang;

  const items = db
    .prepare(
      `SELECT * FROM grammar_structures
       WHERE language LIKE ?
         AND (structure_label LIKE ? OR core_meaning LIKE ? OR pattern LIKE ?)
       ORDER BY id
       LIMIT ? OFFSET ?`,
    )
    .all(langFilter, like, like, like, PAGE_SIZE, offset) as AuditGrammar[];

  const { total } = db
    .prepare(
      `SELECT COUNT(*) AS total FROM grammar_structures
       WHERE language LIKE ?
         AND (structure_label LIKE ? OR core_meaning LIKE ? OR pattern LIKE ?)`,
    )
    .get(langFilter, like, like, like) as { total: number };

  return { items, total, page, pageSize: PAGE_SIZE };
}

export function updateGrammar(
  id: number,
  fields: Partial<AuditGrammar>,
): boolean {
  const allowed = [
    'language', 'structure_label', 'core_meaning', 'primary_communicative_fn',
    'when_to_use', 'pattern', 'key_variations', 'essential_vocabulary_slots',
    'common_learner_mistakes', 'chunk_compatibility', 'primary_function',
    'key_forms', 'essential_vocabulary', 'why_it_matters', 'common_mistakes',
  ];

  const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (updates.length === 0) return false;

  const now = Math.floor(Date.now() / 1000);
  const setClauses = updates.map(([k]) => `${k} = ?`).join(', ');
  const values = updates.map(([, v]) => v);

  const result = db
    .prepare(
      `UPDATE grammar_structures SET ${setClauses}, updated_at = ? WHERE id = ?`,
    )
    .run(...values, now, id);

  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// Vocab
// ---------------------------------------------------------------------------

export function listVocab(
  q: string,
  lang: string,
  page: number,
): PagedResult<AuditVocab> {
  const offset = (page - 1) * PAGE_SIZE;
  const like = `%${q}%`;
  const langFilter = lang === 'all' ? '%' : lang;

  const items = db
    .prepare(
      `SELECT * FROM vocabulary_words
       WHERE language LIKE ?
         AND (word LIKE ? OR primary_meaning LIKE ? OR category LIKE ?)
       ORDER BY id
       LIMIT ? OFFSET ?`,
    )
    .all(langFilter, like, like, like, PAGE_SIZE, offset) as AuditVocab[];

  const { total } = db
    .prepare(
      `SELECT COUNT(*) AS total FROM vocabulary_words
       WHERE language LIKE ?
         AND (word LIKE ? OR primary_meaning LIKE ? OR category LIKE ?)`,
    )
    .get(langFilter, like, like, like) as { total: number };

  return { items, total, page, pageSize: PAGE_SIZE };
}

export function updateVocab(id: number, fields: Partial<AuditVocab>): boolean {
  const allowed = [
    'language', 'word', 'phonetic', 'part_of_speech', 'cefr_level',
    'category', 'subcategory', 'article', 'plural_form', 'countability',
    'regional_variant', 'frequency_rank', 'primary_meaning', 'secondary_meaning',
    'usage_notes', 'common_collocations', 'synonyms', 'antonyms',
    'image_search_query', 'image_context', 'image_tags',
    'example_1', 'example_1_translation', 'example_2', 'example_2_translation',
    'example_3', 'example_3_translation', 'pronunciation_tips', 'memory_hook',
    'related_words', 'common_mistakes', 'learning_priority',
  ];

  const updates = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (updates.length === 0) return false;

  const setClauses = updates.map(([k]) => `${k} = ?`).join(', ');
  const values = updates.map(([, v]) => v);

  const result = db
    .prepare(`UPDATE vocabulary_words SET ${setClauses} WHERE id = ?`)
    .run(...values, id);

  return result.changes > 0;
}
