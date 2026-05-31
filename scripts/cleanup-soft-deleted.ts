/**
 * Cleanup script: hard-delete soft-deleted rows past retention period.
 *
 * Usage:
 *   npx ts-node scripts/cleanup-soft-deleted.ts
 *   SOFT_DELETE_RETENTION_DAYS=30 npx ts-node scripts/cleanup-soft-deleted.ts
 *
 * Env vars:
 *   SOFT_DELETE_RETENTION_DAYS  — grace period before hard-delete (default: 90)
 *   DRY_RUN=1                   — print counts without deleting
 */

import Database from 'better-sqlite3';
import path from 'path';

const RETENTION_DAYS = parseInt(process.env.SOFT_DELETE_RETENTION_DAYS ?? '90', 10);
const DRY_RUN = process.env.DRY_RUN === '1';
const dbPath = path.resolve(process.cwd(), 'chunks_v1.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const cutoff = Math.floor(Date.now() / 1000) - RETENTION_DAYS * 24 * 60 * 60;
const cutoffDate = new Date(cutoff * 1000).toISOString();

console.log(`Retention: ${RETENTION_DAYS} days | Cutoff: ${cutoffDate}${DRY_RUN ? ' | DRY RUN' : ''}\n`);

const targets = [
  { table: 'feynman_explanations', label: 'feynman explanations' },
  { table: 'chunk_reports',        label: 'chunk reports' },
  { table: 'user_progress',        label: 'user_progress entries' },
  { table: 'study_sessions',       label: 'study sessions' },
  /*
  ! chunks deleted last — after dependents — to avoid FK violations.
  ! chunk_versions rows reference chunks(id) with no CASCADE, so they remain
  ! as historical record even after chunk hard-delete.
  */
  { table: 'chunks', label: 'chunks' },
] as const;

let totalDeleted = 0;

for (const { table, label } of targets) {
  if (DRY_RUN) {
    const count = (
      db
        .prepare(`SELECT COUNT(*) as n FROM ${table} WHERE deleted_at IS NOT NULL AND deleted_at < ?`)
        .get(cutoff) as { n: number }
    ).n;
    console.log(`[DRY RUN] Would hard-delete ${count} ${label}`);
    totalDeleted += count;
  } else {
    const result = db
      .prepare(`DELETE FROM ${table} WHERE deleted_at IS NOT NULL AND deleted_at < ?`)
      .run(cutoff);
    console.log(`Hard-deleted ${result.changes} ${label}`);
    totalDeleted += result.changes;
  }
}

console.log(`\nTotal: ${totalDeleted} rows ${DRY_RUN ? 'eligible for deletion' : 'hard-deleted'}`);
db.close();
