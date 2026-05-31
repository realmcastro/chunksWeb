import type { Database } from 'better-sqlite3';

export const name = '0004_user_favorites';

export function up(db: Database): void {
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
    CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created
      ON user_favorites(user_id, created_at DESC);
  `);
}

export function down(db: Database): void {
  db.exec(`DROP TABLE IF EXISTS user_favorites`);
}
