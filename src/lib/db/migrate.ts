import type { Database } from 'better-sqlite3';
import * as m0001 from './migrations/0001_users';
import * as m0002 from './migrations/0002_user_progress';
import * as m0003 from './migrations/0003_feynman';
import * as m0004 from './migrations/0004_user_favorites';
import * as m0005 from './migrations/0005_chunk_reports';
import * as m0006 from './migrations/0006_password_reset_tokens';
import * as m0007 from './migrations/0007_session_activities';
import * as m0008 from './migrations/0008_user_settings';
import * as m0009 from './migrations/0009_gdpr';
import * as m0010 from './migrations/0010_soft_delete';
import * as m0011 from './migrations/0011_fts5';

interface Migration {
  name: string;
  up: (db: Database) => void;
  down?: (db: Database) => void;
}

const MIGRATIONS: Migration[] = [
  m0001,
  m0002,
  m0003,
  m0004,
  m0005,
  m0006,
  m0007,
  m0008,
  m0009,
  m0010,
  m0011,
];

function ensureMigrationsTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);
}

/*
! Runs all pending migrations in order inside individual transactions.
! Applied migrations are recorded in schema_migrations.
! Safe to call on every startup — no-ops if all migrations already applied.
*/
export function runPendingMigrations(db: Database): void {
  ensureMigrationsTable(db);

  for (const migration of MIGRATIONS) {
    const already = db
      .prepare('SELECT 1 FROM schema_migrations WHERE name = ?')
      .get(migration.name);
    if (already) continue;

    const txn = db.transaction(() => {
      migration.up(db);
      db.prepare(
        'INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)',
      ).run(migration.name, Math.floor(Date.now() / 1000));
    });
    txn();
  }
}

/*
! Rolls back the last applied migration.
! Only works if the migration exports a `down` function.
*/
export function rollbackLastMigration(db: Database): void {
  ensureMigrationsTable(db);

  const last = db
    .prepare('SELECT name FROM schema_migrations ORDER BY applied_at DESC, id DESC LIMIT 1')
    .get() as { name: string } | undefined;

  if (!last) {
    console.log('No migrations to roll back.');
    return;
  }

  const migration = MIGRATIONS.find((m) => m.name === last.name);
  if (!migration) {
    throw new Error(`Migration ${last.name} not found in registry`);
  }
  if (!migration.down) {
    throw new Error(`Migration ${last.name} has no down() function`);
  }

  const txn = db.transaction(() => {
    migration.down!(db);
    db.prepare('DELETE FROM schema_migrations WHERE name = ?').run(last.name);
  });
  txn();

  console.log(`Rolled back: ${last.name}`);
}

export function getMigrationStatus(db: Database): {
  applied: string[];
  pending: string[];
} {
  ensureMigrationsTable(db);

  const appliedRows = db
    .prepare('SELECT name FROM schema_migrations ORDER BY applied_at ASC')
    .all() as Array<{ name: string }>;
  const applied = new Set(appliedRows.map((r) => r.name));
  const pending = MIGRATIONS.map((m) => m.name).filter((n) => !applied.has(n));

  return {
    applied: Array.from(applied),
    pending,
  };
}
