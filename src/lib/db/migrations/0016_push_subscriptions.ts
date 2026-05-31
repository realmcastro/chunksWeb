import type { Database } from 'better-sqlite3';

export const name = '0016_push_subscriptions';

export function up(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      last_used_at INTEGER
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_push_subs_user ON user_push_subscriptions(user_id)`);

  /*
  ! reminder_time: HH:MM in user's local time — cron converts to UTC before sending.
  ! review_reminders / streak_reminders: independent toggles.
  */
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_notification_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      review_reminders INTEGER NOT NULL DEFAULT 0,
      streak_reminders INTEGER NOT NULL DEFAULT 1,
      reminder_time TEXT NOT NULL DEFAULT '20:00',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);
}

export function down(db: Database): void {
  db.exec('DROP TABLE IF EXISTS user_notification_settings');
  db.exec('DROP TABLE IF EXISTS user_push_subscriptions');
}
