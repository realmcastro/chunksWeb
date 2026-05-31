import type { Database } from 'better-sqlite3';

export const name = '0013_domain_events';

export function up(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS domain_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      aggregate_id TEXT,
      payload TEXT NOT NULL,
      occurred_at INTEGER NOT NULL,
      processed INTEGER NOT NULL DEFAULT 0,
      idempotency_key TEXT UNIQUE
    );

    CREATE INDEX IF NOT EXISTS idx_domain_events_user_type
      ON domain_events(user_id, event_type, occurred_at);

    CREATE INDEX IF NOT EXISTS idx_domain_events_unprocessed
      ON domain_events(processed, occurred_at) WHERE processed = 0;
  `);
}

export function down(db: Database): void {
  db.exec(`
    DROP INDEX IF EXISTS idx_domain_events_unprocessed;
    DROP INDEX IF EXISTS idx_domain_events_user_type;
    DROP TABLE IF EXISTS domain_events;
  `);
}
