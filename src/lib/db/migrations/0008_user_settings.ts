import type { Database } from 'better-sqlite3';

export const name = '0008_user_settings';

export function up(db: Database): void {
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
  // Add i18n_language if created before this column existed
  const cols = db.pragma('table_info(user_settings)') as Array<{ name: string }>;
  if (!cols.some((c) => c.name === 'i18n_language')) {
    db.exec(`ALTER TABLE user_settings ADD COLUMN i18n_language TEXT NOT NULL DEFAULT 'en'`);
  }
}

export function down(db: Database): void {
  db.exec(`DROP TABLE IF EXISTS user_settings`);
}
