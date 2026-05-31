import type { Database } from 'better-sqlite3';

export const name = '0010_soft_delete';

const SOFT_DELETE_TABLES = [
  'chunks',
  'user_progress',
  'study_sessions',
  'feynman_explanations',
  'chunk_reports',
] as const;

export function up(db: Database): void {
  for (const table of SOFT_DELETE_TABLES) {
    const exists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(table);
    if (!exists) continue;
    const cols = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
    if (!cols.some((c) => c.name === 'deleted_at')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at INTEGER DEFAULT NULL`);
    }
  }

  // Partial indexes — only if referenced tables exist
  const chunksExistsForIndex = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chunks'")
    .get();
  if (chunksExistsForIndex) {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_chunks_not_deleted
        ON chunks(id) WHERE deleted_at IS NULL;
    `);
  }
  const upExistsForIndex = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_progress'")
    .get();
  if (upExistsForIndex) {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_up_active
        ON user_progress(user_id, next_review) WHERE deleted_at IS NULL;
    `);
  }

  // chunk_versions table and trigger require chunks to exist
  if (chunksExistsForIndex) {
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

    const triggerExists = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='trigger' AND name='chunks_version_bu'",
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
}

export function down(db: Database): void {
  db.exec(`
    DROP TRIGGER IF EXISTS chunks_version_bu;
    DROP TABLE IF EXISTS chunk_versions;
  `);
}
