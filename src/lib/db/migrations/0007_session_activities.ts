import type { Database } from 'better-sqlite3';

export const name = '0007_session_activities';

export function up(db: Database): void {
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

export function down(db: Database): void {
  db.exec(`DROP TABLE IF EXISTS session_activities`);
}
