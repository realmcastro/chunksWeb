import type { Database } from 'better-sqlite3';

export const name = '0003_feynman';

export function up(db: Database): void {
  // Legacy migration: add user_id to existing feynman_explanations
  const exists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='feynman_explanations'")
    .get();

  if (exists) {
    const cols = db.pragma('table_info(feynman_explanations)') as Array<{ name: string }>;
    if (!cols.some((c) => c.name === 'user_id')) {
      db.exec(`ALTER TABLE feynman_explanations ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
      db.exec(
        `CREATE INDEX IF NOT EXISTS idx_feynman_user_chunk ON feynman_explanations(user_id, chunk_id)`,
      );
    }
  }

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

export function down(db: Database): void {
  db.exec(`DROP TABLE IF EXISTS feynman_explanations`);
}
