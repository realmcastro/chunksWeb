import Database from 'better-sqlite3';
import path from 'path';
import { runPendingMigrations } from './migrate';

const rawPath = process.env.TEST_DB_PATH ?? 'chunks_v1.db';
const dbPath = rawPath === ':memory:' ? rawPath : path.resolve(process.cwd(), rawPath);

export const db = new Database(dbPath);

/*
! Pragmas configured at module load:
!  - journal_mode=WAL: concurrent reads while a writer is active (better-sqlite3
!    is single-process, but Next dev/HMR can still hit the file from multiple
!    workers). Persists across connections.
!  - foreign_keys=ON: SQLite ships with FK checks DISABLED by default; the
!    schema declares FKs so we must enable enforcement explicitly.
!  - synchronous=NORMAL: pairs with WAL for write speed without sacrificing
!    durability on graceful shutdown.
! See ADR-007 for the rationale and migration plan.
*/
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

runPendingMigrations(db);

export interface Chunk {
  id: number;
  category_id: number;
  source_file: string;
  entry_index: number;
  entry_total: number;
  chunk_text: string;
  meaning: string;
  primary_function: string | null;
  communicative_purpose: string | null;
  trigger_situations: string | null;
  contexts: string | null;
  register_id: number | null;
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
  common_mistakes: string | null;
  similar_contrasting: string | null;
  interference_warnings: string | null;
  nuance: string | null;
  pragmatic_effect: string | null;
  note: string | null;
  recall_cue: string | null;
  spacing_tag: string | null;
  upgrade_path: string | null;
  chunk_family: string | null;
  slug: string | null;
  content_hash: string | null;
  display_order: number;
  is_idiom: number;
  created_at: number;
  updated_at: number;
}

export interface GrammarStructure {
  id: number;
  category_id: number;
  source_file: string;
  entry_index: number;
  entry_total: number;
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
  slug: string | null;
  content_hash: string | null;
  display_order: number;
  created_at: number;
  updated_at: number;
}

export interface Category {
  id: number;
  corpus_id: number;
  code: string;
  name: string;
  type: string;
  source_file: string;
  display_order: number;
  total_entries: number;
  description: string | null;
  color_hex: string | null;
  icon_name: string | null;
  created_at: number;
  updated_at: number;
}

export interface Example {
  id: number;
  item_type: string;
  item_id: number;
  example_index: number;
  text_en: string;
  text_target: string | null;
  audio_path: string | null;
  is_canonical: number;
  created_at: number;
}

export interface Variation {
  id: number;
  chunk_id: number;
  variant: string;
  note: string | null;
}

// Get chunks with pagination
export function getChunks(limit = 20, offset = 0, language?: string): Chunk[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT * FROM chunks
      WHERE language = ? AND deleted_at IS NULL
      ORDER BY frequency DESC, display_order ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(language, limit, offset) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT * FROM chunks
    WHERE deleted_at IS NULL
    ORDER BY frequency DESC, display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as Chunk[];
}

// Get chunks by category
export function getChunksByCategory(
  categoryId: number,
  limit = 20,
  offset = 0,
  language?: string,
): Chunk[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT * FROM chunks
      WHERE category_id = ? AND language = ? AND deleted_at IS NULL
      ORDER BY display_order ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(categoryId, language, limit, offset) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT * FROM chunks
    WHERE category_id = ? AND deleted_at IS NULL
    ORDER BY display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(categoryId, limit, offset) as Chunk[];
}

// Get chunk by ID
export function getChunkById(id: number): Chunk | undefined {
  const stmt = db.prepare('SELECT * FROM chunks WHERE id = ? AND deleted_at IS NULL');
  return stmt.get(id) as Chunk | undefined;
}

// Get chunk by slug
export function getChunkBySlug(slug: string): Chunk | undefined {
  const stmt = db.prepare('SELECT * FROM chunks WHERE slug = ? AND deleted_at IS NULL');
  return stmt.get(slug) as Chunk | undefined;
}

/*
? Search chunks using FTS5 full-text index with porter+unicode61 tokenizer.
? Each word in the query gets a * suffix for prefix matching (e.g. "learn*").
? rank is a negative float — lower = better match — ORDER BY rank gives most-relevant first.
? Falls back to LIKE scan if FTS query parsing fails (malformed input).
*/
export function searchChunks(query: string, limit = 20, offset = 0, language?: string): Chunk[] {
  /*
  ? Build FTS5 query: split on whitespace, sanitize each token (remove FTS special chars),
  ? append * for prefix matching. e.g. "learn run" → "learn* run*"
  */
  // Strip FTS5 special chars; keep letters (including non-ASCII diacritics), digits, spaces
  const sanitized = query.replace(/["'()*+\-:^~{}[\]|]/g, ' ').trim();
  const ftsQuery =
    sanitized.length > 0
      ? sanitized
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => `${w}*`)
          .join(' ')
      : '""';

  try {
    if (language) {
      return db
        .prepare(
          `SELECT c.* FROM chunks c
           JOIN chunks_fts ON chunks_fts.rowid = c.id
           WHERE chunks_fts MATCH ? AND c.language = ? AND c.deleted_at IS NULL
           ORDER BY chunks_fts.rank
           LIMIT ? OFFSET ?`,
        )
        .all(ftsQuery, language, limit, offset) as Chunk[];
    }
    return db
      .prepare(
        `SELECT c.* FROM chunks c
         JOIN chunks_fts ON chunks_fts.rowid = c.id
         WHERE chunks_fts MATCH ? AND c.deleted_at IS NULL
         ORDER BY chunks_fts.rank
         LIMIT ? OFFSET ?`,
      )
      .all(ftsQuery, limit, offset) as Chunk[];
  } catch {
    // Fallback: LIKE scan when FTS query is unparseable
    const pat = `%${query}%`;
    if (language) {
      return db
        .prepare(
          `SELECT * FROM chunks
           WHERE (chunk_text LIKE ? OR meaning LIKE ? OR pattern LIKE ?)
             AND language = ? AND deleted_at IS NULL
           ORDER BY frequency DESC
           LIMIT ? OFFSET ?`,
        )
        .all(pat, pat, pat, language, limit, offset) as Chunk[];
    }
    return db
      .prepare(
        `SELECT * FROM chunks
         WHERE (chunk_text LIKE ? OR meaning LIKE ? OR pattern LIKE ?)
           AND deleted_at IS NULL
         ORDER BY frequency DESC
         LIMIT ? OFFSET ?`,
      )
      .all(pat, pat, pat, limit, offset) as Chunk[];
  }
}

// Get all categories
export function getCategories(): Category[] {
  const stmt = db.prepare('SELECT * FROM categories ORDER BY display_order ASC');
  return stmt.all() as Category[];
}

// Get category by ID
export function getCategoryById(id: number): Category | undefined {
  const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
  return stmt.get(id) as Category | undefined;
}

// Get examples for a chunk
export function getExamplesForChunk(chunkId: number): Example[] {
  const stmt = db.prepare(`
    SELECT * FROM examples 
    WHERE item_type = 'chunk' AND item_id = ?
    ORDER BY example_index ASC
  `);
  return stmt.all(chunkId) as Example[];
}

// Get examples for a grammar structure
export function getExamplesForGrammarStructure(structureId: number): Example[] {
  const stmt = db.prepare(`
    SELECT * FROM examples
    WHERE item_type = 'grammar_structure' AND item_id = ?
    ORDER BY example_index ASC
  `);
  return stmt.all(structureId) as Example[];
}

// Get variations for a chunk
export function getVariationsForChunk(chunkId: number): Variation[] {
  const stmt = db.prepare('SELECT * FROM variations WHERE chunk_id = ?');
  return stmt.all(chunkId) as Variation[];
}

// Get total chunk count
export function getChunkCount(language?: string): number {
  if (language) {
    const stmt = db.prepare(
      'SELECT COUNT(*) as count FROM chunks WHERE language = ? AND deleted_at IS NULL',
    );
    const result = stmt.get(language) as { count: number };
    return result.count;
  }
  const stmt = db.prepare('SELECT COUNT(*) as count FROM chunks WHERE deleted_at IS NULL');
  const result = stmt.get() as { count: number };
  return result.count;
}

// Get chunks count by category
export function getChunkCountByCategory(categoryId: number, language?: string): number {
  if (language) {
    const stmt = db.prepare(
      'SELECT COUNT(*) as count FROM chunks WHERE category_id = ? AND language = ? AND deleted_at IS NULL',
    );
    const result = stmt.get(categoryId, language) as { count: number };
    return result.count;
  }
  const stmt = db.prepare(
    'SELECT COUNT(*) as count FROM chunks WHERE category_id = ? AND deleted_at IS NULL',
  );
  const result = stmt.get(categoryId) as { count: number };
  return result.count;
}

// Get chunks filtered by level
export function getChunksByLevel(
  level: number,
  limit = 20,
  offset = 0,
  language?: string,
): Chunk[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT * FROM chunks
      WHERE cefr_level_id = ? AND language = ? AND deleted_at IS NULL
      ORDER BY display_order ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(level, language, limit, offset) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT * FROM chunks
    WHERE cefr_level_id = ? AND deleted_at IS NULL
    ORDER BY display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(level, limit, offset) as Chunk[];
}

// Get chunks filtered by pattern
export function getChunksByPattern(
  pattern: string,
  limit = 20,
  offset = 0,
  language?: string,
): Chunk[] {
  const searchPattern = `%${pattern}%`;
  if (language) {
    const stmt = db.prepare(`
      SELECT * FROM chunks
      WHERE (pattern LIKE ? OR construction_type LIKE ?) AND language = ? AND deleted_at IS NULL
      ORDER BY display_order ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(searchPattern, searchPattern, language, limit, offset) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT * FROM chunks
    WHERE (pattern LIKE ? OR construction_type LIKE ?) AND deleted_at IS NULL
    ORDER BY display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(searchPattern, searchPattern, limit, offset) as Chunk[];
}

// Get chunks that have collocates
export function getChunksWithCollocates(limit = 20, offset = 0, language?: string): Chunk[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT * FROM chunks
      WHERE typical_collocates IS NOT NULL AND typical_collocates != ''
        AND language = ? AND deleted_at IS NULL
      ORDER BY display_order ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(language, limit, offset) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT * FROM chunks
    WHERE typical_collocates IS NOT NULL AND typical_collocates != ''
      AND deleted_at IS NULL
    ORDER BY display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as Chunk[];
}

// Get chunks by category type (foundation, grammar, chunk)
export function getChunksByCategoryType(
  type: string,
  limit = 20,
  offset = 0,
  language?: string,
): Chunk[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT ch.* FROM chunks ch
      JOIN categories c ON ch.category_id = c.id
      WHERE c.type = ? AND ch.language = ? AND ch.deleted_at IS NULL
      ORDER BY ch.display_order ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(type, language, limit, offset) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT ch.* FROM chunks ch
    JOIN categories c ON ch.category_id = c.id
    WHERE c.type = ? AND ch.deleted_at IS NULL
    ORDER BY ch.display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(type, limit, offset) as Chunk[];
}

// Get chunks by acquisition priority
export function getChunksByPriority(
  priority: string,
  limit = 20,
  offset = 0,
  language?: string,
): Chunk[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT * FROM chunks
      WHERE acquisition_priority = ? AND language = ? AND deleted_at IS NULL
      ORDER BY display_order ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(priority, language, limit, offset) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT * FROM chunks
    WHERE acquisition_priority = ? AND deleted_at IS NULL
    ORDER BY display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(priority, limit, offset) as Chunk[];
}

// Get count by category type
export function getChunkCountByCategoryType(type: string): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM chunks ch
    JOIN categories c ON ch.category_id = c.id
    WHERE c.type = ? AND ch.deleted_at IS NULL
  `);
  const result = stmt.get(type) as { count: number };
  return result.count;
}

// Get count by acquisition priority
export function getChunkCountByPriority(priority: string): number {
  const stmt = db.prepare(
    'SELECT COUNT(*) as count FROM chunks WHERE acquisition_priority = ? AND deleted_at IS NULL',
  );
  const result = stmt.get(priority) as { count: number };
  return result.count;
}

// Get all grammar structures
export function getGrammarStructures(
  limit = 20,
  offset = 0,
  language?: string,
): GrammarStructure[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT * FROM grammar_structures 
      WHERE language = ?
      ORDER BY category_id, display_order ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(language, limit, offset) as GrammarStructure[];
  }
  const stmt = db.prepare(`
    SELECT * FROM grammar_structures 
    ORDER BY category_id, display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as GrammarStructure[];
}

// Get grammar structures by category
export function getGrammarStructuresByCategory(
  categoryId: number,
  limit = 20,
  offset = 0,
  language?: string,
): GrammarStructure[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT * FROM grammar_structures 
      WHERE category_id = ? AND language = ?
      ORDER BY display_order ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(categoryId, language, limit, offset) as GrammarStructure[];
  }
  const stmt = db.prepare(`
    SELECT * FROM grammar_structures 
    WHERE category_id = ?
    ORDER BY display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(categoryId, limit, offset) as GrammarStructure[];
}

// Get total grammar structure count
export function getGrammarStructureCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM grammar_structures');
  const result = stmt.get() as { count: number };
  return result.count;
}

// Get grammar structure count by category
export function getGrammarStructureCountByCategory(categoryId: number): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM grammar_structures WHERE category_id = ?');
  const result = stmt.get(categoryId) as { count: number };
  return result.count;
}

// Get grammar structure by ID
export function getGrammarStructureById(id: number): GrammarStructure | undefined {
  const stmt = db.prepare('SELECT * FROM grammar_structures WHERE id = ?');
  return stmt.get(id) as GrammarStructure | undefined;
}

/*
? Get random grammar structures, optionally filtered by category and language
*/
export function getRandomGrammarStructures(
  categoryId?: number,
  limit = 10,
  language?: string,
): GrammarStructure[] {
  if (categoryId && language) {
    const stmt = db.prepare(`
      SELECT * FROM grammar_structures
      WHERE category_id = ? AND language = ?
      ORDER BY RANDOM()
      LIMIT ?
    `);
    return stmt.all(categoryId, language, limit) as GrammarStructure[];
  }
  if (categoryId) {
    const stmt = db.prepare(`
      SELECT * FROM grammar_structures
      WHERE category_id = ?
      ORDER BY RANDOM()
      LIMIT ?
    `);
    return stmt.all(categoryId, limit) as GrammarStructure[];
  }
  if (language) {
    const stmt = db.prepare(`
      SELECT * FROM grammar_structures
      WHERE language = ?
      ORDER BY RANDOM()
      LIMIT ?
    `);
    return stmt.all(language, limit) as GrammarStructure[];
  }
  const stmt = db.prepare(`
    SELECT * FROM grammar_structures
    ORDER BY RANDOM()
    LIMIT ?
  `);
  return stmt.all(limit) as GrammarStructure[];
}

// Search grammar structures
export function searchGrammarStructures(query: string, limit = 20, offset = 0): GrammarStructure[] {
  const searchPattern = `%${query}%`;
  const stmt = db.prepare(`
    SELECT * FROM grammar_structures 
    WHERE structure_label LIKE ? OR core_meaning LIKE ? OR pattern LIKE ?
    ORDER BY display_order ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(searchPattern, searchPattern, searchPattern, limit, offset) as GrammarStructure[];
}

// ============================================================
// USER PROGRESS TABLES AND FUNCTIONS
// ============================================================

export interface UserProgress {
  id: number;
  chunk_id: number;
  repetitions: number;
  ease_factor: number;
  interval: number;
  next_review: number;
  last_reviewed: number;
  created_at: number;
  updated_at: number;
}

export interface StudySession {
  id: number;
  date: string;
  chunks_reviewed: number;
  chunks_mastered: number;
  created_at: number;
}

export interface ProgressStats {
  totalChunks: number;
  totalGrammar: number;
  categories: number;
  mastered: number;
  dueToday: number;
  streak: number;
  categoryProgress: CategoryProgress[];
}

export interface CategoryProgress {
  id: number;
  name: string;
  color_hex: string | null;
  chunks: number;
  grammarStructures: number;
  mastered: number;
  percentage: number;
}

// @deprecated — logic moved to src/lib/db/migrations/0002_user_progress.ts
function migrateAddUserIdToProgressTables(): void {
  // Check if table exists by querying sqlite_master
  const userProgressExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_progress'")
    .get();

  if (userProgressExists) {
    const tableInfo = db.prepare('PRAGMA table_info(user_progress)').all() as { name: string }[];
    const hasUserId = tableInfo.some((col) => col.name === 'user_id');

    if (!hasUserId) {
      db.exec(`ALTER TABLE user_progress ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
      db.exec('DROP INDEX IF EXISTS idx_user_progress_next_review');
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_user_progress_user_next ON user_progress(user_id, next_review)',
      );
    }

    // ON CONFLICT(user_id, chunk_id) requires a UNIQUE index on (user_id, chunk_id)
    const hasUniqueUserChunk = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_user_progress_user_chunk_uq'",
      )
      .get();
    if (!hasUniqueUserChunk) {
      db.exec(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_user_chunk_uq ON user_progress(user_id, chunk_id)',
      );
    }
  }

  const studySessionsExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='study_sessions'")
    .get();

  if (studySessionsExists) {
    const sessionInfo = db.prepare('PRAGMA table_info(study_sessions)').all() as { name: string }[];
    const sessionHasUserId = sessionInfo.some((col) => col.name === 'user_id');

    if (!sessionHasUserId) {
      db.exec(`ALTER TABLE study_sessions ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, date)',
      );
    }

    // ON CONFLICT(user_id, date) requires a UNIQUE index on (user_id, date)
    const hasUniqueUserDate = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_study_sessions_user_date_uq'",
      )
      .get();
    if (!hasUniqueUserDate) {
      db.exec(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_study_sessions_user_date_uq ON study_sessions(user_id, date)',
      );
    }
  }

  const feynmanExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='feynman_explanations'")
    .get();

  if (feynmanExists) {
    const feynmanInfo = db.prepare('PRAGMA table_info(feynman_explanations)').all() as {
      name: string;
    }[];
    const feynmanHasUserId = feynmanInfo.some((col) => col.name === 'user_id');

    if (!feynmanHasUserId) {
      db.exec(`ALTER TABLE feynman_explanations ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_feynman_user_chunk ON feynman_explanations(user_id, chunk_id)',
      );
    }
  }
}

/*
! Inicializa tabelas user_progress e study_sessions com suporte a user_id
*/
export function initUserProgressTables(): void {
  // First, run migration to add user_id to existing tables
  migrateAddUserIdToProgressTables();

  // Now create tables only if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      chunk_id INTEGER NOT NULL,
      repetitions INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      next_review INTEGER DEFAULT 0,
      last_reviewed INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (chunk_id) REFERENCES chunks(id),
      UNIQUE(user_id, chunk_id)
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      date TEXT NOT NULL,
      chunks_reviewed INTEGER DEFAULT 0,
      chunks_mastered INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(user_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_user_progress_user_next ON user_progress(user_id, next_review);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, date);
  `);
}

/*
? Get chunks that are due for review today for a specific user (next_review <= now)
*/
export function getDueChunks(
  userId: number,
  limit = 20,
  language?: string,
): (Chunk & { progress?: UserProgress })[] {
  const now = Math.floor(Date.now() / 1000);

  if (language) {
    const stmt = db.prepare(`
      SELECT c.*,
             up.repetitions,
             up.ease_factor,
             up.interval,
             up.next_review,
             up.last_reviewed
      FROM chunks c
      LEFT JOIN user_progress up ON c.id = up.chunk_id AND up.user_id = ? AND up.deleted_at IS NULL
      WHERE (up.next_review IS NULL OR up.next_review <= ?)
        AND c.language = ? AND c.deleted_at IS NULL
      ORDER BY up.next_review ASC NULLS FIRST, c.frequency DESC
      LIMIT ?
    `);
    return stmt.all(userId, now, language, limit) as (Chunk & { progress?: UserProgress })[];
  }

  const stmt = db.prepare(`
    SELECT c.*,
           up.repetitions,
           up.ease_factor,
           up.interval,
           up.next_review,
           up.last_reviewed
    FROM chunks c
    LEFT JOIN user_progress up ON c.id = up.chunk_id AND up.user_id = ? AND up.deleted_at IS NULL
    WHERE (up.next_review IS NULL OR up.next_review <= ?) AND c.deleted_at IS NULL
    ORDER BY up.next_review ASC NULLS FIRST, c.frequency DESC
    LIMIT ?
  `);

  return stmt.all(userId, now, limit) as (Chunk & { progress?: UserProgress })[];
}

/*
? Get progress for a specific chunk for a user
*/
export function getChunkProgress(userId: number, chunkId: number): UserProgress | null {
  const stmt = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND chunk_id = ?');
  return stmt.get(userId, chunkId) as UserProgress | null;
}

/*
? Get due chunks count for today for a user
*/
export function getDueChunksCount(userId: number): number {
  const now = Math.floor(Date.now() / 1000);
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND next_review <= ?
  `);
  const result = stmt.get(userId, now) as { count: number };

  const neverReviewedStmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND next_review IS NULL
  `);
  const neverReviewed = neverReviewedStmt.get(userId) as { count: number };

  return result.count + neverReviewed.count;
}

/*
! Atualiza progresso de um chunk após review com SM-2 para um usuário específico
? quality: 0-5 rating from learner
*/
export function updateChunkProgress(
  userId: number,
  chunkId: number,
  _quality: number,
  sm2Result: {
    repetitions: number;
    easeFactor: number;
    interval: number;
    nextReview: Date;
  },
): UserProgress {
  const now = Math.floor(Date.now() / 1000);
  const nextReviewTs = Math.floor(sm2Result.nextReview.getTime() / 1000);

  const stmt = db.prepare(`
    INSERT INTO user_progress (user_id, chunk_id, repetitions, ease_factor, interval, next_review, last_reviewed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, chunk_id) DO UPDATE SET
      repetitions = excluded.repetitions,
      ease_factor = excluded.ease_factor,
      interval = excluded.interval,
      next_review = excluded.next_review,
      last_reviewed = excluded.last_reviewed,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    userId,
    chunkId,
    sm2Result.repetitions,
    sm2Result.easeFactor,
    sm2Result.interval,
    nextReviewTs,
    now,
    now,
    now,
  );

  return getChunkProgress(userId, chunkId)!;
}

/*
? Get number of chunks that have reached mastery for a user (repetitions >= 3)
*/
export function getMasteredCount(userId: number): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND repetitions >= 3
  `);
  const result = stmt.get(userId) as { count: number };
  return result.count;
}

/*
? Get mastered count by category for a user
*/
export function getMasteredCountByCategory(userId: number, categoryId: number): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress up
    JOIN chunks c ON up.chunk_id = c.id
    WHERE up.user_id = ? AND c.category_id = ? AND up.repetitions >= 3
  `);
  const result = stmt.get(userId, categoryId) as { count: number };
  return result.count;
}

/*
? Calculate current streak for a user from study sessions
*/
export function getCurrentStreak(userId: number): number {
  const stmt = db.prepare(`
    SELECT date FROM study_sessions 
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT 30
  `);
  const sessions = stmt.all(userId) as { date: string }[];

  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sessions.length; i++) {
    const sessionDate = new Date(sessions[i].date);
    sessionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (sessionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0 && sessionDate.getTime() === expectedDate.getTime() - 86400000) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/*
? Record or update today's study session for a user
*/
export function recordStudySession(
  userId: number,
  chunksReviewed: number,
  chunksMastered: number = 0,
): StudySession {
  const today = new Date().toISOString().split('T')[0];
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT INTO study_sessions (user_id, date, chunks_reviewed, chunks_mastered, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      chunks_reviewed = chunks_reviewed + excluded.chunks_reviewed,
      chunks_mastered = chunks_mastered + excluded.chunks_mastered
  `);

  stmt.run(userId, today, chunksReviewed, chunksMastered, now);

  const getStmt = db.prepare('SELECT * FROM study_sessions WHERE user_id = ? AND date = ?');
  return getStmt.get(userId, today) as StudySession;
}

/*
? Get all progress statistics for a user for dashboard.
? Uses GROUP BY queries instead of per-category loops for O(1) DB calls.
*/
export function getProgressStats(userId: number): ProgressStats {
  const totalChunks = getChunkCount();
  const totalGrammar = getGrammarStructureCount();
  const mastered = getMasteredCount(userId);
  const dueToday = getDueChunksCount(userId);
  const streak = getCurrentStreak(userId);

  // Single query: chunk counts per category
  const chunkCounts = db
    .prepare(
      `
    SELECT category_id, COUNT(*) as count FROM chunks GROUP BY category_id
  `,
    )
    .all() as { category_id: number; count: number }[];

  // Single query: grammar structure counts per category
  const grammarCounts = db
    .prepare(
      `
    SELECT category_id, COUNT(*) as count FROM grammar_structures GROUP BY category_id
  `,
    )
    .all() as { category_id: number; count: number }[];

  // Single query: mastered chunks per category for this user
  const masteredCounts = db
    .prepare(
      `
    SELECT c.category_id, COUNT(*) as count
    FROM user_progress up
    JOIN chunks c ON up.chunk_id = c.id
    WHERE up.user_id = ? AND up.repetitions >= 3
    GROUP BY c.category_id
  `,
    )
    .all(userId) as { category_id: number; count: number }[];

  // Build lookup maps
  const chunkMap = new Map(chunkCounts.map((r) => [r.category_id, r.count]));
  const grammarMap = new Map(grammarCounts.map((r) => [r.category_id, r.count]));
  const masteredMap = new Map(masteredCounts.map((r) => [r.category_id, r.count]));

  const categories = getCategories();

  const categoryProgress = categories.map((cat) => {
    const chunks = chunkMap.get(cat.id) ?? 0;
    const grammarStructures = grammarMap.get(cat.id) ?? 0;
    const masteredInCat = masteredMap.get(cat.id) ?? 0;
    const totalItems = chunks + grammarStructures;
    return {
      id: cat.id,
      name: cat.name,
      color_hex: cat.color_hex,
      chunks,
      grammarStructures,
      mastered: masteredInCat,
      percentage: totalItems > 0 ? Math.round((masteredInCat / totalItems) * 100) : 0,
    };
  });

  return {
    totalChunks,
    totalGrammar,
    categories: categories.length,
    mastered,
    dueToday,
    streak,
    categoryProgress,
  };
}

/*
? Get number of chunks reviewed today across all modes for a user
*/
export function getTodayStudiedCount(userId: number): number {
  const today = new Date().toISOString().split('T')[0];
  const result = db
    .prepare(
      `
    SELECT COALESCE(SUM(chunks_reviewed), 0) as total
    FROM study_sessions
    WHERE user_id = ? AND date = ?
  `,
    )
    .get(userId, today) as { total: number };
  return result.total;
}

/*
? Get number of Feynman explanations submitted today for a user
*/
export function getTodayFeynmanCount(userId: number): number {
  const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const result = db
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM feynman_explanations
    WHERE user_id = ? AND created_at >= ?
  `,
    )
    .get(userId, startOfDay) as { count: number };
  return result.count;
}

/*
? Get chunks that have been started by a user (have progress record)
*/
export function getStartedChunksCount(userId: number): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?');
  const result = stmt.get(userId) as { count: number };
  return result.count;
}

/*
? Check if a chunk has been mastered by a user (repetitions >= 3)
*/
export function isChunkMastered(userId: number, chunkId: number): boolean {
  const progress = getChunkProgress(userId, chunkId);
  return progress !== null && progress.repetitions >= 3;
}

// ============================================================
// FEYNMAN MODE TABLES AND FUNCTIONS
// ============================================================

export interface FeynmanExplanation {
  id: number;
  chunk_id: number;
  explanation: string;
  quality: number;
  created_at: number;
}

/*
! Initializes feynman_explanations table with user_id support.
*/
export function initFeynmanTable(): void {
  // Migration first - check if table exists and add user_id if needed
  const feynmanExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='feynman_explanations'")
    .get();

  if (feynmanExists) {
    const feynmanInfo = db.prepare('PRAGMA table_info(feynman_explanations)').all() as {
      name: string;
    }[];
    const feynmanHasUserId = feynmanInfo.some((col) => col.name === 'user_id');

    if (!feynmanHasUserId) {
      db.exec(`ALTER TABLE feynman_explanations ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
    }
  }

  // Now create table (IF NOT EXISTS will be no-op if table exists)
  db.exec(`
    CREATE TABLE IF NOT EXISTS feynman_explanations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      chunk_id INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      quality INTEGER DEFAULT 2,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (chunk_id) REFERENCES chunks(id),
      UNIQUE(user_id, chunk_id, created_at)
    );

    CREATE INDEX IF NOT EXISTS idx_feynman_user_chunk ON feynman_explanations(user_id, chunk_id);
  `);
}

/*
? Get chunks that have been mastered by a user (repetitions >= 3)
*/
export function getMasteredChunks(userId: number, limit = 20, offset = 0): Chunk[] {
  const stmt = db.prepare(`
    SELECT c.* FROM chunks c
    JOIN user_progress up ON c.id = up.chunk_id
    WHERE up.user_id = ? AND up.repetitions >= 3
      AND c.deleted_at IS NULL AND up.deleted_at IS NULL
    ORDER BY up.next_review ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(userId, limit, offset) as Chunk[];
}

/*
? Get mastered chunks count for a user
*/
export function getMasteredChunksCount(userId: number): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND repetitions >= 3
  `);
  const result = stmt.get(userId) as { count: number };
  return result.count;
}

/*
? Save a Feynman explanation for a chunk for a user
*/
export function saveFeynmanExplanation(
  userId: number,
  chunkId: number,
  explanation: string,
  quality: number,
): FeynmanExplanation {
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT INTO feynman_explanations (user_id, chunk_id, explanation, quality, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(userId, chunkId, explanation, quality, now);

  const getStmt = db.prepare('SELECT * FROM feynman_explanations WHERE id = ?');
  return getStmt.get(result.lastInsertRowid) as FeynmanExplanation;
}

/*
? Get explanations for a specific chunk for a user
*/
export function getFeynmanExplanationsForChunk(
  userId: number,
  chunkId: number,
): FeynmanExplanation[] {
  const stmt = db.prepare(`
    SELECT * FROM feynman_explanations 
    WHERE user_id = ? AND chunk_id = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(userId, chunkId) as FeynmanExplanation[];
}

/*
? Get Feynman analytics for a user:
? - Quality distribution (count per quality)
? - Last 14 days daily activity
? - Chunks with declining quality (latest < first)
? - Chunks with improving quality (latest > first)
? - Most-struggled chunks (most quality=1 attempts)
*/
export interface FeynmanAnalytics {
  qualityDistribution: { quality: number; count: number }[];
  dailyActivity: { date: string; count: number }[];
  improvingChunks: {
    chunk_id: number;
    chunk_text: string;
    first_quality: number;
    last_quality: number;
  }[];
  decliningChunks: {
    chunk_id: number;
    chunk_text: string;
    first_quality: number;
    last_quality: number;
  }[];
  strugglingChunks: {
    chunk_id: number;
    chunk_text: string;
    attempts: number;
    last_quality: number;
  }[];
  totalExplanations: number;
  uniqueChunks: number;
}

export function getFeynmanAnalytics(userId: number): FeynmanAnalytics {
  const qualityDist = db
    .prepare(
      `
    SELECT quality, COUNT(*) as count
    FROM feynman_explanations
    WHERE user_id = ?
    GROUP BY quality
    ORDER BY quality ASC
  `,
    )
    .all(userId) as { quality: number; count: number }[];

  // Daily activity for last 14 days
  const dailyActivity = db
    .prepare(
      `
    SELECT date(created_at, 'unixepoch') as date, COUNT(*) as count
    FROM feynman_explanations
    WHERE user_id = ? AND created_at >= strftime('%s', 'now', '-14 days')
    GROUP BY date(created_at, 'unixepoch')
    ORDER BY date ASC
  `,
    )
    .all(userId) as { date: string; count: number }[];

  // Chunks with first and latest quality
  const chunkTrends = db
    .prepare(
      `
    WITH ranked AS (
      SELECT chunk_id, quality, created_at,
             ROW_NUMBER() OVER (PARTITION BY chunk_id ORDER BY created_at ASC) as rn_asc,
             ROW_NUMBER() OVER (PARTITION BY chunk_id ORDER BY created_at DESC) as rn_desc
      FROM feynman_explanations
      WHERE user_id = ?
    ),
    first_last AS (
      SELECT
        f.chunk_id,
        f.quality AS first_quality,
        l.quality AS last_quality,
        c.chunk_text
      FROM ranked f
      JOIN ranked l ON f.chunk_id = l.chunk_id AND l.rn_desc = 1
      JOIN chunks c ON f.chunk_id = c.id
      WHERE f.rn_asc = 1 AND f.chunk_id IN (
        SELECT chunk_id FROM feynman_explanations WHERE user_id = ? GROUP BY chunk_id HAVING COUNT(*) > 1
      )
    )
    SELECT * FROM first_last
  `,
    )
    .all(userId, userId) as {
    chunk_id: number;
    chunk_text: string;
    first_quality: number;
    last_quality: number;
  }[];

  const improvingChunks = chunkTrends.filter((c) => c.last_quality > c.first_quality).slice(0, 5);

  const decliningChunks = chunkTrends.filter((c) => c.last_quality < c.first_quality).slice(0, 5);

  // Most struggled: chunks with most quality=1 attempts
  const strugglingChunks = db
    .prepare(
      `
    SELECT fe.chunk_id, c.chunk_text,
           COUNT(*) as attempts,
           MAX(CASE WHEN fe.created_at = (SELECT MAX(created_at) FROM feynman_explanations WHERE user_id = fe.user_id AND chunk_id = fe.chunk_id) THEN fe.quality END) as last_quality
    FROM feynman_explanations fe
    JOIN chunks c ON fe.chunk_id = c.id
    WHERE fe.user_id = ? AND fe.quality = 1
    GROUP BY fe.chunk_id
    ORDER BY attempts DESC
    LIMIT 5
  `,
    )
    .all(userId) as {
    chunk_id: number;
    chunk_text: string;
    attempts: number;
    last_quality: number;
  }[];

  const totals = db
    .prepare(
      `
    SELECT COUNT(*) as total, COUNT(DISTINCT chunk_id) as unique_chunks
    FROM feynman_explanations WHERE user_id = ?
  `,
    )
    .get(userId) as { total: number; unique_chunks: number };

  return {
    qualityDistribution: qualityDist,
    dailyActivity,
    improvingChunks,
    decliningChunks,
    strugglingChunks,
    totalExplanations: totals.total,
    uniqueChunks: totals.unique_chunks,
  };
}

/*
? Get all Feynman explanations for a user, joined with chunk text and meaning for history view
*/
export function getAllFeynmanExplanations(userId: number): {
  id: number;
  chunk_id: number;
  chunk_text: string;
  meaning: string;
  explanation: string;
  quality: number;
  created_at: number;
}[] {
  const stmt = db.prepare(`
    SELECT fe.id, fe.chunk_id, c.chunk_text, c.meaning, fe.explanation, fe.quality, fe.created_at
    FROM feynman_explanations fe
    JOIN chunks c ON fe.chunk_id = c.id
    WHERE fe.user_id = ?
    ORDER BY fe.created_at DESC
  `);
  return stmt.all(userId) as any[];
}

/*
? Get chunks for Feynman practice for a user (mastered chunks that user wants to practice explaining)
*/
export function getFeynmanChunksForStudy(userId: number, limit = 10): Chunk[] {
  const stmt = db.prepare(`
    SELECT c.* FROM chunks c
    JOIN user_progress up ON c.id = up.chunk_id
    WHERE up.user_id = ? AND up.repetitions >= 3
      AND c.deleted_at IS NULL AND up.deleted_at IS NULL
    ORDER BY RANDOM()
    LIMIT ?
  `);
  return stmt.all(userId, limit) as Chunk[];
}

/*
? Smart Feynman chunk selection for a user, optionally filtered by language:
? 1. Chunks where the latest Feynman quality = 1 (struggling) — highest priority
? 2. Chunks Feynman-practiced before but not recently (longest time since last session)
? 3. Any random chunks as fallback
? Returns chunk IDs with their latest explanation quality and created_at for context
*/
export interface SmartFeynmanChunk extends Chunk {
  last_feynman_quality: number | null;
  last_feynman_at: number | null;
  last_feynman_explanation: string | null;
}

export function getSmartFeynmanChunks(
  userId: number,
  limit = 10,
  language?: string,
): SmartFeynmanChunk[] {
  if (language) {
    const stmt = db.prepare(`
      WITH latest_feynman AS (
        SELECT chunk_id,
               quality AS last_quality,
               explanation AS last_explanation,
               created_at AS last_at,
               ROW_NUMBER() OVER (PARTITION BY chunk_id ORDER BY created_at DESC) AS rn
        FROM feynman_explanations
        WHERE user_id = ? AND deleted_at IS NULL
      )
      SELECT c.*,
             lf.last_quality AS last_feynman_quality,
             lf.last_at      AS last_feynman_at,
             lf.last_explanation AS last_feynman_explanation
      FROM chunks c
      LEFT JOIN latest_feynman lf ON c.id = lf.chunk_id AND lf.rn = 1
      WHERE c.language = ? AND c.deleted_at IS NULL
      ORDER BY
        CASE WHEN lf.last_quality = 1 THEN 0 ELSE 1 END ASC,
        CASE WHEN lf.last_at IS NULL THEN 0 ELSE lf.last_at END ASC,
        RANDOM()
      LIMIT ?
    `);
    return stmt.all(userId, language, limit) as SmartFeynmanChunk[];
  }

  // Get chunks that have been Feynman'd before, ranked by priority
  const stmt = db.prepare(`
    WITH latest_feynman AS (
      SELECT chunk_id,
             quality AS last_quality,
             explanation AS last_explanation,
             created_at AS last_at,
             ROW_NUMBER() OVER (PARTITION BY chunk_id ORDER BY created_at DESC) AS rn
      FROM feynman_explanations
      WHERE user_id = ? AND deleted_at IS NULL
    )
    SELECT c.*,
           lf.last_quality AS last_feynman_quality,
           lf.last_at      AS last_feynman_at,
           lf.last_explanation AS last_feynman_explanation
    FROM chunks c
    LEFT JOIN latest_feynman lf ON c.id = lf.chunk_id AND lf.rn = 1
    WHERE c.deleted_at IS NULL
    ORDER BY
      CASE WHEN lf.last_quality = 1 THEN 0 ELSE 1 END ASC,
      CASE WHEN lf.last_at IS NULL THEN 0 ELSE lf.last_at END ASC,
      RANDOM()
    LIMIT ?
  `);
  return stmt.all(userId, limit) as SmartFeynmanChunk[];
}

/*
? Get the most recent Feynman explanation for a specific chunk and user
*/
export function getLastFeynmanExplanation(
  userId: number,
  chunkId: number,
): { explanation: string; quality: number; created_at: number } | null {
  const stmt = db.prepare(`
    SELECT explanation, quality, created_at
    FROM feynman_explanations
    WHERE user_id = ? AND chunk_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);
  return stmt.get(userId, chunkId) as {
    explanation: string;
    quality: number;
    created_at: number;
  } | null;
}

/*
! userId deve ser o ID real do usuário autenticado — não o limit.
? Get quick practice chunks for a user (due chunks limited to 10), optionally filtered by language.
*/
export function getQuickPracticeChunks(userId: number, limit = 10, language?: string): Chunk[] {
  const now = Math.floor(Date.now() / 1000);

  if (language) {
    const stmt = db.prepare(`
      SELECT c.*, up.repetitions, up.ease_factor, up.interval, up.next_review, up.last_reviewed
      FROM chunks c
      LEFT JOIN user_progress up ON c.id = up.chunk_id AND up.user_id = ? AND up.deleted_at IS NULL
      WHERE c.language = ? AND (up.next_review IS NULL OR up.next_review <= ?)
        AND c.deleted_at IS NULL
      ORDER BY up.next_review ASC NULLS FIRST, RANDOM()
      LIMIT ?
    `);
    return stmt.all(userId, language, now, limit) as Chunk[];
  }

  const stmt = db.prepare(`
    SELECT c.*, up.repetitions, up.ease_factor, up.interval, up.next_review, up.last_reviewed
    FROM chunks c
    LEFT JOIN user_progress up ON c.id = up.chunk_id AND up.user_id = ? AND up.deleted_at IS NULL
    WHERE (up.next_review IS NULL OR up.next_review <= ?) AND c.deleted_at IS NULL
    ORDER BY up.next_review ASC NULLS FIRST, RANDOM()
    LIMIT ?
  `);

  return stmt.all(userId, now, limit) as Chunk[];
}

/*
? Get quick practice due count for a user
*/
export function getQuickPracticeDueCount(userId: number): number {
  return getDueChunksCount(userId);
}

// ============================================================
// RANDOM STUDY & CATEGORY FUNCTIONS
// ============================================================

// Get chunks by IDs array
export function getChunksByIds(chunkIds: number[]): Chunk[] {
  if (chunkIds.length === 0) {
    return [];
  }

  const placeholders = chunkIds.map(() => '?').join(',');
  const stmt = db.prepare(`
    SELECT * FROM chunks
    WHERE id IN (${placeholders})
    ORDER BY display_order ASC
  `);

  return stmt.all(...chunkIds) as Chunk[];
}

/*
? Get random chunks, optionally filtered by category and language
*/
export function getRandomChunks(categoryId?: number, limit = 10, language?: string): Chunk[] {
  if (categoryId && language) {
    const stmt = db.prepare(`
      SELECT c.* FROM chunks c
      WHERE c.category_id = ? AND c.language = ? AND c.deleted_at IS NULL
      ORDER BY RANDOM()
      LIMIT ?
    `);
    return stmt.all(categoryId, language, limit) as Chunk[];
  }
  if (categoryId) {
    const stmt = db.prepare(`
      SELECT c.* FROM chunks c
      WHERE c.category_id = ? AND c.deleted_at IS NULL
      ORDER BY RANDOM()
      LIMIT ?
    `);
    return stmt.all(categoryId, limit) as Chunk[];
  }
  if (language) {
    const stmt = db.prepare(`
      SELECT c.* FROM chunks c
      WHERE c.language = ? AND c.deleted_at IS NULL
      ORDER BY RANDOM()
      LIMIT ?
    `);
    return stmt.all(language, limit) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT c.* FROM chunks c
    WHERE c.deleted_at IS NULL
    ORDER BY RANDOM()
    LIMIT ?
  `);
  return stmt.all(limit) as Chunk[];
}

/*
? Get categories with progress info for learn page
*/
export interface CategoryWithProgress {
  id: number;
  name: string;
  color_hex: string | null;
  code: string;
  type: string;
  totalChunks: number;
  learnedChunks: number;
  masteredChunks: number;
}

export function getCategoriesWithProgress(language?: string): CategoryWithProgress[] {
  const categories = getCategories();

  const learnedStmt = language
    ? db.prepare(`
        SELECT COUNT(*) as count FROM user_progress up
        JOIN chunks c ON up.chunk_id = c.id
        WHERE c.category_id = ? AND c.language = ? AND up.repetitions > 0
      `)
    : db.prepare(`
        SELECT COUNT(*) as count FROM user_progress up
        JOIN chunks c ON up.chunk_id = c.id
        WHERE c.category_id = ? AND up.repetitions > 0
      `);

  const masteredStmt = language
    ? db.prepare(`
        SELECT COUNT(*) as count FROM user_progress up
        JOIN chunks c ON up.chunk_id = c.id
        WHERE c.category_id = ? AND c.language = ? AND up.repetitions >= 3
      `)
    : db.prepare(`
        SELECT COUNT(*) as count FROM user_progress up
        JOIN chunks c ON up.chunk_id = c.id
        WHERE c.category_id = ? AND up.repetitions >= 3
      `);

  return categories.map((cat) => {
    const isGrammar = cat.type === 'grammar' || cat.type === 'foundation';

    // Grammar/foundation categories hold grammar_structures, not chunks
    const totalChunks = isGrammar
      ? getGrammarStructureCountByCategory(cat.id)
      : getChunkCountByCategory(cat.id, language);

    if (isGrammar) {
      return {
        id: cat.id,
        name: cat.name,
        color_hex: cat.color_hex,
        code: cat.code,
        type: cat.type,
        totalChunks,
        learnedChunks: 0,
        masteredChunks: 0,
      };
    }

    const learnedResult = (
      language ? learnedStmt.get(cat.id, language) : learnedStmt.get(cat.id)
    ) as { count: number };
    const masteredResult = (
      language ? masteredStmt.get(cat.id, language) : masteredStmt.get(cat.id)
    ) as { count: number };

    return {
      id: cat.id,
      name: cat.name,
      color_hex: cat.color_hex,
      code: cat.code,
      type: cat.type,
      totalChunks,
      learnedChunks: learnedResult.count,
      masteredChunks: masteredResult.count,
    };
  });
}

/*
? Get chunks by category with examples for study
*/
export function getChunksForStudyByCategory(categoryId: number, limit = 20, offset = 0): Chunk[] {
  const stmt = db.prepare(`
    SELECT c.* FROM chunks c
    WHERE c.category_id = ? AND c.deleted_at IS NULL
    ORDER BY RANDOM()
    LIMIT ? OFFSET ?
  `);
  return stmt.all(categoryId, limit, offset) as Chunk[];
}

/*
? Start learning chunks - creates user_progress entry with repetitions=0 for a user
? This marks chunks as "started" so they appear in progress
*/
export function startChunkProgress(userId: number, chunkIds: number[]): void {
  const now = Math.floor(Date.now() / 1000);

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO user_progress 
    (user_id, chunk_id, repetitions, ease_factor, interval, next_review, last_reviewed, created_at, updated_at)
    VALUES (?, ?, 0, 2.5, 0, ?, 0, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const chunkId of chunkIds) {
      stmt.run(userId, chunkId, now, now, now);
    }
  });

  transaction();
}

/*
? Get chunks started count for a user (repetitions > 0)
*/
export function getStartedCount(userId: number): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?
  `);
  const result = stmt.get(userId) as { count: number };
  return result.count;
}

/*
! Removes a chunk from the user's study queue (deletes the user_progress row).
! Destroys SM-2 progress for that chunk — caller MUST confirm with the user.
! Resetting (keep row, repetitions=0) is a separate function: see resetChunkProgress.
*/
export function removeChunkFromStudy(userId: number, chunkId: number): void {
  db.prepare('DELETE FROM user_progress WHERE user_id = ? AND chunk_id = ?').run(userId, chunkId);
}

/*
! Keeps the user_progress row but resets SM-2 state to the initial values.
! Use when the user wants to re-learn a chunk without losing it from their queue.
*/
export function resetChunkProgress(userId: number, chunkId: number): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `
    UPDATE user_progress
    SET repetitions = 0, ease_factor = 2.5, interval = 0, next_review = ?, last_reviewed = 0, updated_at = ?
    WHERE user_id = ? AND chunk_id = ?
  `,
  ).run(now, now, userId, chunkId);
}

/*
? Returns chunks the user previously rated low (last quality < 3 inferred from low repetitions
? after a recent review). Heuristic: repetitions=0 AND last_reviewed>0 means most recent
? review reset the streak (SM-2 sets repetitions=0 on quality<3).
*/
export function getErroredChunksForUser(userId: number, limit = 20, language?: string): Chunk[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT c.*
      FROM user_progress up
      JOIN chunks c ON c.id = up.chunk_id
      WHERE up.user_id = ? AND up.repetitions = 0 AND up.last_reviewed > 0 AND c.language = ?
      ORDER BY up.last_reviewed DESC
      LIMIT ?
    `);
    return stmt.all(userId, language, limit) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT c.*
    FROM user_progress up
    JOIN chunks c ON c.id = up.chunk_id
    WHERE up.user_id = ? AND up.repetitions = 0 AND up.last_reviewed > 0
    ORDER BY up.last_reviewed DESC
    LIMIT ?
  `);
  return stmt.all(userId, limit) as Chunk[];
}

/*
? Returns true when a user_progress row already exists for the user+chunk pair.
? Used by the UI to render "added to study" state without exposing SM-2 internals.
*/
export function isChunkInStudy(userId: number, chunkId: number): boolean {
  const stmt = db.prepare(
    'SELECT 1 as found FROM user_progress WHERE user_id = ? AND chunk_id = ? LIMIT 1',
  );
  const row = stmt.get(userId, chunkId) as { found: number } | undefined;
  return !!row;
}

// ============================================================
// USER FAVORITES
// ============================================================

/*
! Favorites are independent from SM-2 study state.
! A chunk can be favorited without being in the study queue, and vice versa.
*/
export function initUserFavoritesTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chunk_id INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (chunk_id) REFERENCES chunks(id),
      UNIQUE(user_id, chunk_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
    -- Hot path: getFavoritesForUser orders by created_at DESC under user_id filter.
    -- Compound index makes the sort index-only, no temp B-tree.
    CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created
      ON user_favorites(user_id, created_at DESC);
  `);
}

export function isFavorite(userId: number, chunkId: number): boolean {
  const stmt = db.prepare(
    'SELECT 1 as found FROM user_favorites WHERE user_id = ? AND chunk_id = ? LIMIT 1',
  );
  const row = stmt.get(userId, chunkId) as { found: number } | undefined;
  return !!row;
}

export function addFavorite(userId: number, chunkId: number): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    'INSERT OR IGNORE INTO user_favorites (user_id, chunk_id, created_at) VALUES (?, ?, ?)',
  ).run(userId, chunkId, now);
}

export function removeFavorite(userId: number, chunkId: number): void {
  db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND chunk_id = ?').run(userId, chunkId);
}

// ============================================================
// CHUNK REPORTS (content quality flagging)
// ============================================================

/*
! User-submitted reports about chunk content (incorrect meaning, typo, etc).
! Status workflow: open → triaged → resolved. Reason capped at 500 chars at API layer.
*/
export function initChunkReportsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chunk_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chunk_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (chunk_id) REFERENCES chunks(id)
    );

    CREATE INDEX IF NOT EXISTS idx_chunk_reports_chunk ON chunk_reports(chunk_id);
    CREATE INDEX IF NOT EXISTS idx_chunk_reports_user ON chunk_reports(user_id);
    CREATE INDEX IF NOT EXISTS idx_chunk_reports_status ON chunk_reports(status);
  `);
}

export function createChunkReport(userId: number, chunkId: number, reason: string): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `
    INSERT INTO chunk_reports (user_id, chunk_id, reason, status, created_at)
    VALUES (?, ?, ?, 'open', ?)
  `,
  ).run(userId, chunkId, reason, now);
}

/*
? Returns favorited chunks for a user joined with chunk metadata.
? Most-recent favorites first. Supports optional language filter and pagination.
*/
export function getFavoritesForUser(
  userId: number,
  limit = 50,
  offset = 0,
  language?: string,
): Chunk[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT c.*
      FROM user_favorites uf
      JOIN chunks c ON c.id = uf.chunk_id
      WHERE uf.user_id = ? AND c.language = ? AND c.deleted_at IS NULL
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(userId, language, limit, offset) as Chunk[];
  }
  const stmt = db.prepare(`
    SELECT c.*
    FROM user_favorites uf
    JOIN chunks c ON c.id = uf.chunk_id
    WHERE uf.user_id = ? AND c.deleted_at IS NULL
    ORDER BY uf.created_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(userId, limit, offset) as Chunk[];
}

export function getFavoritesCount(userId: number, language?: string): number {
  if (language) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM user_favorites uf
      JOIN chunks c ON c.id = uf.chunk_id
      WHERE uf.user_id = ? AND c.language = ? AND c.deleted_at IS NULL
    `);
    return (stmt.get(userId, language) as { count: number }).count;
  }
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_favorites uf
    JOIN chunks c ON c.id = uf.chunk_id
    WHERE uf.user_id = ? AND c.deleted_at IS NULL
  `);
  return (stmt.get(userId) as { count: number }).count;
}

/*
? Returns chunk IDs for random selection from a user's favorites.
? Used by /study/random?source=favorites.
*/
/*
? Bulk export rows for the user: progress + favorites + sessions.
? Joins chunk_text so the export is human-readable without re-joining.
*/
export interface ExportRow {
  chunk_id: number;
  chunk_text: string;
  repetitions: number;
  ease_factor: number;
  interval: number;
  next_review: number;
  last_reviewed: number;
  favorited: number;
}

export function getProgressExport(userId: number): ExportRow[] {
  const stmt = db.prepare(`
    SELECT
      c.id as chunk_id,
      c.chunk_text,
      up.repetitions,
      up.ease_factor,
      up.interval,
      up.next_review,
      up.last_reviewed,
      CASE WHEN uf.chunk_id IS NULL THEN 0 ELSE 1 END as favorited
    FROM user_progress up
    JOIN chunks c ON c.id = up.chunk_id
    LEFT JOIN user_favorites uf ON uf.chunk_id = up.chunk_id AND uf.user_id = up.user_id
    WHERE up.user_id = ?
    ORDER BY up.last_reviewed DESC
  `);
  return stmt.all(userId) as ExportRow[];
}

export function getRandomFavoriteIds(
  userId: number,
  limit: number,
  language?: string,
): number[] {
  if (language) {
    const stmt = db.prepare(`
      SELECT uf.chunk_id as id
      FROM user_favorites uf
      JOIN chunks c ON c.id = uf.chunk_id
      WHERE uf.user_id = ? AND c.language = ?
      ORDER BY RANDOM() LIMIT ?
    `);
    return (stmt.all(userId, language, limit) as { id: number }[]).map((r) => r.id);
  }
  const stmt = db.prepare(`
    SELECT chunk_id as id FROM user_favorites
    WHERE user_id = ? ORDER BY RANDOM() LIMIT ?
  `);
  return (stmt.all(userId, limit) as { id: number }[]).map((r) => r.id);
}

// ============================================================
// USER AUTHENTICATION TABLES AND FUNCTIONS
// ============================================================

export interface User {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
  created_at: number;
  deleted_at: number | null;
}

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: number;
  used_at: number | null;
  created_at: number;
}

/*
! Initializes users table if not exists.
*/
export function initUsersTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  try {
    db.exec(`ALTER TABLE users ADD COLUMN email TEXT UNIQUE`);
  } catch {
    /* Column already exists */
  }
}

/*
! Initializes password_reset_tokens table for email-based password recovery.
! Token stored as SHA-256 hash; raw token sent via email only.
*/
export function initPasswordResetTokensTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
  `);
}

/*
? Create a new user with hashed password
*/
export function createUser(username: string, passwordHash: string, email?: string): User | null {
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, email, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const now = Math.floor(Date.now() / 1000);
  const result = stmt.run(username, passwordHash, email ?? null, now);

  const getStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return getStmt.get(result.lastInsertRowid) as User;
}

/*
? Get user by username
*/
export function getUserByUsername(username: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as User | undefined;
}

/*
? Get user by ID
*/
export function getUserById(id: number): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
}

/*
? Verify password against bcrypt hash. Falls back to plaintext for pre-hash migration:
? if hash doesn't start with $2b/$2a$ it was stored as plaintext — accept and signal re-hash needed.
*/
export function verifyPassword(password: string, hash: string): boolean {
  // bcrypt hashes always start with $2b$ or $2a$
  if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
    // bcrypt comparison is sync via bcryptjs — import lazily to avoid edge-runtime issues
    const bcrypt = require('bcryptjs') as typeof import('bcryptjs');
    return bcrypt.compareSync(password, hash);
  }
  // Legacy plaintext comparison (migration path — password will be re-hashed on next login)
  return password === hash;
}

/*
? Hash a password with bcrypt (cost factor 12).
*/
export function hashPassword(password: string): string {
  const bcrypt = require('bcryptjs') as typeof import('bcryptjs');
  return bcrypt.hashSync(password, 12);
}

/*
? Update the stored password hash for a user (used during migration from plaintext to bcrypt).
*/
export function updatePasswordHash(userId: number, newHash: string): void {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);
}

/*
? Get user by email (case-insensitive lookup via pre-normalized storage).
*/
export function getUserByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | undefined;
}

/*
? Store a hashed password reset token with expiry (unix seconds).
*/
export function createPasswordResetToken(userId: number, tokenHash: string, expiresAt: number): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, tokenHash, expiresAt, now);
}

/*
? Find a valid (unused + not expired) reset token by its hash.
*/
export function findValidResetToken(tokenHash: string): PasswordResetToken | undefined {
  const now = Math.floor(Date.now() / 1000);
  return db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
  `).get(tokenHash, now) as PasswordResetToken | undefined;
}

/*
? Mark a reset token as consumed (single-use enforcement).
*/
export function consumeResetToken(tokenId: number): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?').run(now, tokenId);
}

/*
? Remove expired or already-used tokens to keep table lean.
*/
export function deleteExpiredResetTokens(): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('DELETE FROM password_reset_tokens WHERE expires_at < ? OR used_at IS NOT NULL').run(now);
}

// ============================================================
// SESSION ACTIVITIES TABLE AND FUNCTIONS
// ============================================================

export interface SessionActivity {
  id: number;
  user_id: number;
  session_date: string;
  mode: string;
  chunk_ids: string;
  grammar_ids: string | null;
  created_at: number;
}

/*
! Initializes session_activities table for tracking studied chunks per session.
*/
export function initSessionActivitiesTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS session_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_date TEXT NOT NULL,
      mode TEXT NOT NULL,
      chunk_ids TEXT NOT NULL,
      grammar_ids TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(user_id, session_date, mode)
    );

    CREATE INDEX IF NOT EXISTS idx_session_activities_user_mode ON session_activities(user_id, mode);
  `);
}

/*
? Record session activity with chunk IDs for later retrieval in review/feynman modes.
*/
export function recordSessionActivity(
  userId: number,
  mode: string,
  chunkIds: number[],
): SessionActivity {
  const today = new Date().toISOString().split('T')[0];
  const now = Math.floor(Date.now() / 1000);
  const chunkIdsJson = JSON.stringify(chunkIds);

  const stmt = db.prepare(`
    INSERT INTO session_activities (user_id, session_date, mode, chunk_ids, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, session_date, mode) DO UPDATE SET
      chunk_ids = excluded.chunk_ids,
      created_at = excluded.created_at
  `);

  stmt.run(userId, today, mode, chunkIdsJson, now);

  const getStmt = db.prepare(
    'SELECT * FROM session_activities WHERE user_id = ? AND session_date = ? AND mode = ?',
  );
  return getStmt.get(userId, today, mode) as SessionActivity;
}

/*
? Get chunk IDs from a previous session for a user and mode.
*/
export function getPreviousSessionChunkIds(userId: number, mode: string): number[] {
  const stmt = db.prepare(`
    SELECT chunk_ids FROM session_activities
    WHERE user_id = ? AND mode = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const result = stmt.get(userId, mode) as { chunk_ids: string } | undefined;

  if (!result) {
    return [];
  }

  try {
    return JSON.parse(result.chunk_ids);
  } catch {
    return [];
  }
}

/*
? Get recent session activities for a user.
*/
export function getRecentSessionActivities(userId: number, limit = 10): SessionActivity[] {
  const stmt = db.prepare(`
    SELECT * FROM session_activities
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return stmt.all(userId, limit) as SessionActivity[];
}

/*
? Get user's recent chunk IDs from study sessions (for dashboard recent chunks).
*/
export function getUserRecentChunkIds(userId: number, limit = 10): number[] {
  const stmt = db.prepare(`
    SELECT chunk_ids FROM session_activities
    WHERE user_id = ? AND chunk_ids != '[]'
    ORDER BY created_at DESC
    LIMIT 5
  `);

  const sessions = stmt.all(userId) as { chunk_ids: string }[];

  if (sessions.length === 0) {
    return [];
  }

  // Combine and dedupe chunk IDs from recent sessions
  const allIds = new Set<number>();
  for (const session of sessions) {
    try {
      const ids = JSON.parse(session.chunk_ids);
      ids.forEach((id: number) => allIds.add(id));
    } catch {
      // Skip invalid JSON
    }
  }

  return Array.from(allIds).slice(0, limit);
}

/*
? Get chunks that user has started (has progress entry with repetitions > 0).
*/
export function getStartedChunksForUser(userId: number, limit = 10): Chunk[] {
  const stmt = db.prepare(`
    SELECT c.* FROM chunks c
    JOIN user_progress up ON c.id = up.chunk_id
    WHERE up.user_id = ? AND up.repetitions > 0
    ORDER BY up.updated_at DESC
    LIMIT ?
  `);

  return stmt.all(userId, limit) as Chunk[];
}

/*
! Tabela de preferências do usuário (linguagem de estudo e I18n).
? Separada de tts_settings para manter separação de concerns.
*/
export function initUserSettingsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      learning_language TEXT NOT NULL DEFAULT 'en',
      i18n_language TEXT NOT NULL DEFAULT 'en',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(user_id)
    );
  `);
}

/*
? Returns the user's currently selected learning language. Defaults to 'en' if not set.
*/
export function getUserLearningLanguage(userId: number): string {
  const stmt = db.prepare('SELECT learning_language FROM user_settings WHERE user_id = ?');
  const row = stmt.get(userId) as { learning_language: string } | undefined;
  return row?.learning_language ?? 'en';
}

/*
! Upserts the learning language for a user — safe to call multiple times.
*/
export function setUserLearningLanguage(userId: number, language: string): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `
    INSERT INTO user_settings (user_id, learning_language, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      learning_language = excluded.learning_language,
      updated_at = excluded.updated_at
  `,
  ).run(userId, language, now, now);
}

/*
? Returns the user's currently selected I18n language. Defaults to 'en' if not set.
*/
export function getUserI18nLanguage(userId: number): string {
  const stmt = db.prepare('SELECT i18n_language FROM user_settings WHERE user_id = ?');
  const row = stmt.get(userId) as { i18n_language: string } | undefined;
  return row?.i18n_language ?? 'en';
}

/*
! Upserts the I18n language for a user — safe to call multiple times.
*/
export function setUserI18nLanguage(userId: number, language: string): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `
    INSERT INTO user_settings (user_id, i18n_language, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      i18n_language = excluded.i18n_language,
      updated_at = excluded.updated_at
  `,
  ).run(userId, language, now, now);
}

// Schema initialization moved to runPendingMigrations (called above after pragma setup).

// ============================================================
// GDPR: ACCOUNT DELETION + DATA EXPORT
// ============================================================

/*
! Adds deleted_at column to users table (soft-delete support).
! Creates user_audit_log table for compliance event tracking.
! Both are idempotent — safe to run on every startup.
*/
function initGdprSchema(): void {
  const columns = db.pragma('table_info(users)') as Array<{ name: string }>;
  const hasDeletedAt = columns.some((c) => c.name === 'deleted_at');
  if (!hasDeletedAt) {
    db.exec('ALTER TABLE users ADD COLUMN deleted_at INTEGER DEFAULT NULL');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_audit_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      event      TEXT NOT NULL,
      metadata   TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_log_user
    ON user_audit_log(user_id);
  `);
}

// initGdprSchema(); — moved to migration 0009_gdpr

/*
! Soft-delete: sets deleted_at timestamp on user row.
! Does NOT cascade — related data remains until hard-delete.
! Records audit event for compliance trail.
*/
export function softDeleteUser(userId: number): void {
  const now = Math.floor(Date.now() / 1000);
  const txn = db.transaction(() => {
    db.prepare('UPDATE users SET deleted_at = ? WHERE id = ?').run(now, userId);
    db.prepare(
      'INSERT INTO user_audit_log (user_id, event, metadata, created_at) VALUES (?, ?, ?, ?)'
    ).run(userId, 'account_deletion_requested', JSON.stringify({ soft: true }), now);
  });
  txn();
}

/*
! Hard-delete: permanently removes user and ALL related data.
! Tables cascade: user_progress, study_sessions, feynman_explanations,
! user_favorites, chunk_reports, session_activities, user_settings,
! tts_settings, voice_preferences, user_audit_log, users.
!
! Order: dependents first, then user row.
*/
export function hardDeleteUser(userId: number): void {
  const txn = db.transaction(() => {
    db.prepare('DELETE FROM user_progress WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM study_sessions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM feynman_explanations WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_favorites WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM chunk_reports WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM session_activities WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM tts_settings WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM voice_preferences WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_audit_log WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  txn();
}

export interface UserDataExport {
  user: { id: number; username: string; created_at: number };
  progress: unknown[];
  studySessions: unknown[];
  feynmanExplanations: unknown[];
  favorites: unknown[];
  reports: unknown[];
  sessionActivities: unknown[];
  settings: unknown[];
  ttsSettings: unknown;
  voicePreferences: unknown[];
}

/*
! Exports all user data as a single JSON-serializable object.
! Used for GDPR/LGPD data portability (right of access).
*/
export function exportUserData(userId: number): UserDataExport {
  const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(userId) as
    | { id: number; username: string; created_at: number }
    | undefined;

  if (!user) {
    return {
      user: { id: userId, username: '', created_at: 0 },
      progress: [], studySessions: [], feynmanExplanations: [],
      favorites: [], reports: [], sessionActivities: [],
      settings: [], ttsSettings: null, voicePreferences: [],
    };
  }

  return {
    user,
    progress: db.prepare('SELECT * FROM user_progress WHERE user_id = ?').all(userId),
    studySessions: db.prepare('SELECT * FROM study_sessions WHERE user_id = ?').all(userId),
    feynmanExplanations: db.prepare('SELECT * FROM feynman_explanations WHERE user_id = ?').all(userId),
    favorites: db.prepare('SELECT * FROM user_favorites WHERE user_id = ?').all(userId),
    reports: db.prepare('SELECT * FROM chunk_reports WHERE user_id = ?').all(userId),
    sessionActivities: db.prepare('SELECT * FROM session_activities WHERE user_id = ?').all(userId),
    settings: db.prepare('SELECT * FROM user_settings WHERE user_id = ?').all(userId),
    ttsSettings: db.prepare('SELECT * FROM tts_settings WHERE user_id = ?').get(userId) ?? null,
    voicePreferences: db.prepare('SELECT * FROM voice_preferences WHERE user_id = ?').all(userId),
  };
}

/*
! Returns user IDs where deleted_at is older than graceDays.
! Used by cleanup script for hard-delete after grace period.
*/
export function getSoftDeletedUsersForPurge(graceDays: number = 30): number[] {
  const cutoff = Math.floor(Date.now() / 1000) - (graceDays * 24 * 60 * 60);
  const rows = db.prepare(
    'SELECT id FROM users WHERE deleted_at IS NOT NULL AND deleted_at < ?'
  ).all(cutoff) as Array<{ id: number }>;
  return rows.map((r) => r.id);
}

// ============================================================
// SOFT-DELETE MIGRATIONS (Item 18)
// ============================================================

/*
! Adds deleted_at column to content and user-data tables.
! Creates chunk_versions table + BEFORE UPDATE trigger for audit trail.
! Creates partial indexes on deleted_at IS NULL for hot query paths.
! All operations idempotent — safe to run on every startup.
*/
function initSoftDeleteMigrations(): void {
  const tables = [
    'chunks',
    'user_progress',
    'study_sessions',
    'feynman_explanations',
    'chunk_reports',
  ] as const;

  for (const table of tables) {
    const tableExists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(table);
    if (!tableExists) continue;
    const cols = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
    if (!cols.some((c) => c.name === 'deleted_at')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at INTEGER DEFAULT NULL`);
    }
  }

  /*
  ? Partial indexes skip soft-deleted rows on the most frequently scanned paths.
  ? idx_chunks_not_deleted: used by getChunks, browse, search, getDueChunks.
  ? idx_up_active: used by getDueChunks (user_id + next_review hot path).
  */
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chunks_not_deleted
      ON chunks(id) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_up_active
      ON user_progress(user_id, next_review) WHERE deleted_at IS NULL;
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS chunk_versions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      chunk_id   INTEGER NOT NULL REFERENCES chunks(id),
      chunk_text TEXT NOT NULL,
      meaning    TEXT NOT NULL,
      edited_by  INTEGER,
      edited_at  INTEGER DEFAULT (strftime('%s', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_chunk_versions_chunk ON chunk_versions(chunk_id);
  `);

  /*
  ! BEFORE UPDATE trigger: saves old chunk_text/meaning to chunk_versions before
  ! each edit that changes either field. edited_by is NULL (no session in trigger).
  */
  const triggerExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='trigger' AND name='chunks_version_bu'"
    )
    .get();
  if (!triggerExists) {
    db.exec(`
      CREATE TRIGGER chunks_version_bu
      BEFORE UPDATE OF chunk_text, meaning ON chunks
      WHEN OLD.chunk_text != NEW.chunk_text OR OLD.meaning != NEW.meaning
      BEGIN
        INSERT INTO chunk_versions(chunk_id, chunk_text, meaning, edited_at)
        VALUES(OLD.id, OLD.chunk_text, OLD.meaning, strftime('%s', 'now'));
      END;
    `);
  }
}

// initSoftDeleteMigrations(); — moved to migration 0010_soft_delete

// ============================================================
// FTS5 FULL-TEXT SEARCH (Item 17)
// ============================================================

/*
! Creates chunks_fts virtual table using FTS5 with porter+unicode61 tokenizer.
! porter: English stemming (run/running/ran → run).
! unicode61: diacritic-aware tokenization for PT/ES/FR content.
! content='chunks' + content_rowid='id': external-content table — FTS stores only
!   the search index; actual text is read from chunks at query time. Triggers keep
!   the index in sync with INSERT/UPDATE/DELETE on chunks.
*/
function initChunksFTS(): void {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      chunk_text,
      meaning,
      content='chunks',
      content_rowid='id',
      tokenize='porter unicode61'
    );
  `);

  const triggerNames = ['chunks_fts_ai', 'chunks_fts_ad', 'chunks_fts_au'];
  const existing = new Set(
    (
      db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='trigger' AND name IN (${triggerNames.map(() => '?').join(',')})`,
        )
        .all(...triggerNames) as Array<{ name: string }>
    ).map((r) => r.name),
  );

  if (!existing.has('chunks_fts_ai')) {
    db.exec(`
      CREATE TRIGGER chunks_fts_ai AFTER INSERT ON chunks BEGIN
        INSERT INTO chunks_fts(rowid, chunk_text, meaning)
        VALUES (new.id, new.chunk_text, new.meaning);
      END;
    `);
  }

  if (!existing.has('chunks_fts_ad')) {
    db.exec(`
      CREATE TRIGGER chunks_fts_ad AFTER DELETE ON chunks BEGIN
        INSERT INTO chunks_fts(chunks_fts, rowid, chunk_text, meaning)
        VALUES('delete', old.id, old.chunk_text, old.meaning);
      END;
    `);
  }

  if (!existing.has('chunks_fts_au')) {
    db.exec(`
      CREATE TRIGGER chunks_fts_au AFTER UPDATE ON chunks BEGIN
        INSERT INTO chunks_fts(chunks_fts, rowid, chunk_text, meaning)
        VALUES('delete', old.id, old.chunk_text, old.meaning);
        INSERT INTO chunks_fts(rowid, chunk_text, meaning)
        VALUES (new.id, new.chunk_text, new.meaning);
      END;
    `);
  }

  /*
  ? Backfill: if FTS index is empty but chunks table has rows, populate the index.
  ? This runs once on first deploy after FTS5 is added.
  */
  const ftsCount = (
    db.prepare('SELECT COUNT(*) as n FROM chunks_fts').get() as { n: number }
  ).n;
  if (ftsCount === 0) {
    const chunkCount = (
      db.prepare('SELECT COUNT(*) as n FROM chunks').get() as { n: number }
    ).n;
    if (chunkCount > 0) {
      db.exec(
        `INSERT INTO chunks_fts(rowid, chunk_text, meaning) SELECT id, chunk_text, meaning FROM chunks`,
      );
    }
  }
}

// initChunksFTS(); — moved to migration 0011_fts5

// ============================================================
// SOFT-DELETE HELPERS (Item 18)
// ============================================================

export function softDeleteChunk(id: number): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('UPDATE chunks SET deleted_at = ? WHERE id = ?').run(now, id);
}

export function restoreChunk(id: number): void {
  db.prepare('UPDATE chunks SET deleted_at = NULL WHERE id = ?').run(id);
}

export function softDeleteUserProgress(userId: number, chunkId: number): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    'UPDATE user_progress SET deleted_at = ? WHERE user_id = ? AND chunk_id = ?',
  ).run(now, userId, chunkId);
}

export function softDeleteStudySession(id: number): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('UPDATE study_sessions SET deleted_at = ? WHERE id = ?').run(now, id);
}

export function softDeleteFeynmanExplanation(id: number): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('UPDATE feynman_explanations SET deleted_at = ? WHERE id = ?').run(now, id);
}

export function softDeleteChunkReport(id: number): void {
  const now = Math.floor(Date.now() / 1000);
  db.prepare('UPDATE chunk_reports SET deleted_at = ? WHERE id = ?').run(now, id);
}

// ============================================================
// CHUNK VERSION HISTORY (Item 18)
// ============================================================

export interface ChunkVersion {
  id: number;
  chunk_id: number;
  chunk_text: string;
  meaning: string;
  edited_by: number | null;
  edited_at: number;
}

/*
? Returns all saved versions for a chunk, most-recent first.
? Versions are created automatically by the chunks_version_bu trigger.
*/
export function getChunkVersionHistory(chunkId: number): ChunkVersion[] {
  return db
    .prepare(`SELECT * FROM chunk_versions WHERE chunk_id = ? ORDER BY edited_at DESC`)
    .all(chunkId) as ChunkVersion[];
}

/*
! Restores chunk_text and meaning from a saved version.
! The restore itself will trigger chunks_version_bu, creating a new version
! entry with the current (pre-restore) values — full rollback chain preserved.
*/
export function restoreChunkVersion(chunkId: number, versionId: number): boolean {
  const version = db
    .prepare('SELECT * FROM chunk_versions WHERE id = ? AND chunk_id = ?')
    .get(versionId, chunkId) as ChunkVersion | undefined;
  if (!version) return false;

  const result = db
    .prepare('UPDATE chunks SET chunk_text = ?, meaning = ?, updated_at = ? WHERE id = ?')
    .run(version.chunk_text, version.meaning, Math.floor(Date.now() / 1000), chunkId);

  return result.changes > 0;
}

/*
! Returns chunk IDs where deleted_at is older than retentionDays.
! Used by cleanup script for hard-delete after grace period.
*/
export function getSoftDeletedChunksForPurge(retentionDays: number = 90): number[] {
  const cutoff = Math.floor(Date.now() / 1000) - retentionDays * 24 * 60 * 60;
  return (
    db
      .prepare('SELECT id FROM chunks WHERE deleted_at IS NOT NULL AND deleted_at < ?')
      .all(cutoff) as Array<{ id: number }>
  ).map((r) => r.id);
}
