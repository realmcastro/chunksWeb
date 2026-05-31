#!/usr/bin/env tsx
/**
 * Migration CLI — run with: npx tsx scripts/db-migrate.ts [command]
 *
 * Commands:
 *   up (default)  — apply all pending migrations
 *   down          — roll back the last applied migration
 *   status        — list applied and pending migrations
 */

import Database from 'better-sqlite3';
import path from 'path';
import { runPendingMigrations, rollbackLastMigration, getMigrationStatus } from '../src/lib/db/migrate';

const dbPath = path.resolve(process.cwd(), 'chunks_v1.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const command = process.argv[2] ?? 'up';

switch (command) {
  case 'up': {
    console.log('Running pending migrations...');
    runPendingMigrations(db);
    const { applied, pending } = getMigrationStatus(db);
    console.log(`Applied: ${applied.length} | Pending: ${pending.length}`);
    if (pending.length === 0) console.log('All migrations up to date.');
    break;
  }

  case 'down': {
    rollbackLastMigration(db);
    break;
  }

  case 'status': {
    const { applied, pending } = getMigrationStatus(db);
    console.log('\nApplied:');
    applied.forEach((n) => console.log(`  ✓ ${n}`));
    console.log('\nPending:');
    if (pending.length === 0) {
      console.log('  (none)');
    } else {
      pending.forEach((n) => console.log(`  ○ ${n}`));
    }
    break;
  }

  default:
    console.error(`Unknown command: ${command}. Use: up | down | status`);
    process.exit(1);
}

db.close();
