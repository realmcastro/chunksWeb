import type { Database } from 'better-sqlite3';

export const name = '0005_chunk_reports';

export function up(db: Database): void {
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

export function down(db: Database): void {
  db.exec(`DROP TABLE IF EXISTS chunk_reports`);
}
