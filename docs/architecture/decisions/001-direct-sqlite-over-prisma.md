# ADR-001: Direct SQLite (better-sqlite3) Over Prisma ORM

## Status

Accepted — implemented and in production. Superseded in part by ADR-006 (2026-05-21), which removed the remaining Prisma packages.

## Context

Project needs a database layer for a Next.js PWA. Prisma exists in `package.json` and was initially used for schema management, but the actual query layer evolved to use direct SQLite via better-sqlite3.

## Decision

Use better-sqlite3 synchronous API for all database queries. (Original decision retained Prisma for schema visualization; that residue was removed by ADR-006.)

All queries are centralized in `src/lib/db/sqlite.ts` (~900+ lines).

## Rationale

1. **Synchronous API** — better-sqlite3 is synchronous, which simplifies Next.js API route handlers. No async/await overhead for DB calls.
2. **Performance** — Direct SQLite is faster than Prisma for simple queries on embedded databases. No query engine overhead.
3. **Control** — Full control over SQL queries, joins, and optimization. No ORM abstraction hiding query behavior.
4. **Simplicity** — Single-file query layer is easy to audit and understand. No migration complexity.
5. **Offline-first** — SQLite file-based DB aligns with PWA offline requirements.

## Trade-offs

| Gain | Cost |
|------|------|
| Query performance | Manual query writing |
| Full SQL control | No type-safe query builder |
| Synchronous simplicity | Single-file grows large |
| No ORM overhead | Manual schema migration |

## Consequences

- All new queries MUST go in `sqlite.ts`
- Schema changes require manual SQL DDL (no migration tool yet)
- Type safety at query boundaries is manual (interfaces at top of sqlite.ts)

## Risks

- `sqlite.ts` is already ~900+ lines and growing → consider splitting by domain
- No query type safety → runtime errors possible if schema drifts
- SQLite limitations for concurrent writes (WAL mode helps)
