import type { Database } from 'better-sqlite3';

export const name = '0001_users';

export function up(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  // For databases where the table already existed without the email column:
  const cols = db.pragma('table_info(users)') as Array<{ name: string }>;
  if (!cols.some((c) => c.name === 'email')) {
    // SQLite cannot add a UNIQUE column via ALTER TABLE; add without constraint and
    // rely on application-level uniqueness checks for legacy rows.
    try {
      db.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
    } catch {
      /* column already exists */
    }
  }
}

export function down(db: Database): void {
  db.exec(`DROP TABLE IF EXISTS users`);
}
