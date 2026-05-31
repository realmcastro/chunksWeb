import type { Database } from 'better-sqlite3';

export const name = '0009_gdpr';

export function up(db: Database): void {
  const cols = db.pragma('table_info(users)') as Array<{ name: string }>;
  if (!cols.some((c) => c.name === 'deleted_at')) {
    db.exec(`ALTER TABLE users ADD COLUMN deleted_at INTEGER DEFAULT NULL`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_audit_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      event      TEXT NOT NULL,
      metadata   TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON user_audit_log(user_id);
  `);
}

export function down(db: Database): void {
  db.exec(`DROP TABLE IF EXISTS user_audit_log`);
}
