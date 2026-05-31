import type { Database } from 'better-sqlite3';

export const name = '0002_user_progress';

export function up(db: Database): void {
  // Legacy migration: add user_id to existing user_progress + study_sessions
  const upExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_progress'")
    .get();

  if (upExists) {
    const cols = db.pragma('table_info(user_progress)') as Array<{ name: string }>;
    if (!cols.some((c) => c.name === 'user_id')) {
      db.exec(`ALTER TABLE user_progress ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
      db.exec(`DROP INDEX IF EXISTS idx_user_progress_next_review`);
      db.exec(
        `CREATE INDEX IF NOT EXISTS idx_user_progress_user_next ON user_progress(user_id, next_review)`,
      );
    }
    const hasUQ = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_user_progress_user_chunk_uq'",
      )
      .get();
    if (!hasUQ) {
      db.exec(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_user_chunk_uq ON user_progress(user_id, chunk_id)`,
      );
    }
  }

  const ssExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='study_sessions'")
    .get();

  if (ssExists) {
    const cols = db.pragma('table_info(study_sessions)') as Array<{ name: string }>;
    if (!cols.some((c) => c.name === 'user_id')) {
      db.exec(`ALTER TABLE study_sessions ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
      db.exec(
        `CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, date)`,
      );
    }
    const hasUQ = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_study_sessions_user_date_uq'",
      )
      .get();
    if (!hasUQ) {
      db.exec(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_study_sessions_user_date_uq ON study_sessions(user_id, date)`,
      );
    }
  }

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

export function down(db: Database): void {
  db.exec(`
    DROP TABLE IF EXISTS user_progress;
    DROP TABLE IF EXISTS study_sessions;
  `);
}
