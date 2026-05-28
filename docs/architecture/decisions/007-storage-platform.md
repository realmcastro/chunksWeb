# ADR-007 — Storage platform: stay on better-sqlite3 vs migrate to Turso/D1

Status: Proposed

## Context

`prisma/chunks_v1.db` is a single committed SQLite file (~MB) loaded with `better-sqlite3`. This works well for:

- single-process dev,
- read-heavy workloads (chunks, grammar, vocab),
- offline-first (the DB ships with the app).

It does NOT work for:

- multi-instance deploys (each instance has its own writeable copy),
- multi-device sync (user's progress is on whichever instance they hit),
- live backups (`PRAGMA backup` still needs orchestration),
- a Vercel/edge deployment (the FS is ephemeral or read-only).

## Options

### A. Stay on better-sqlite3 + Litestream
- Add `PRAGMA journal_mode = WAL` and replicate via Litestream to S3.
- Pros: zero query rewrites, low ops cost, durable backups.
- Cons: still single-writer. No edge support. No multi-instance.

### B. Migrate to Turso (libSQL)
- libSQL is SQLite-compatible. Driver `@libsql/client` exposes both sync and async APIs.
- Pros: edge-deployable, replication built-in, multi-region.
- Cons: rewrite every `db.prepare().get()/all()/run()` call (1.5k lines of SQL).
  Network latency per query. Cost.

### C. Migrate to Cloudflare D1
- Similar story to Turso but more constrained API.
- Pros: cheap on Cloudflare stack.
- Cons: query API is async-only, no `prepare()` cache. Significant rewrite.

### D. Postgres (Supabase / Neon)
- Pros: mature, full SQL, multi-instance trivial.
- Cons: SQL dialect differences (RANDOM(), date functions, FTS). Larger rewrite.

## Decision

Defer. better-sqlite3 is acceptable for the current single-server PWA shape.

When the project needs multi-instance OR edge OR write-from-mobile-without-server:

1. Adopt ADR-006 (feature directories) fully so DB calls live in feature-local repositories.
2. Pick Turso (lowest-friction libSQL migration) as the default target.
3. Replace `src/lib/db/sqlite.ts` with adapter exposing the same function signatures over libSQL.

## Followups before migrating

- `db.pragma('journal_mode = WAL')` in `sqlite.ts` for concurrent reads (no migration risk).
- Add `db.pragma('foreign_keys = ON')` — schema already has FKs but they may not be enforced.
- Split `sqlite.ts` per domain (chunks, progress, favorites, vocab, grammar) so the adapter swap is per-file.
