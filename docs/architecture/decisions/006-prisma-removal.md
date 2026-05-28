# ADR-006: Complete Removal of Prisma

## Status

Accepted — 2026-05-21.

## Context

ADR-001 retained `@prisma/client` and `prisma` packages for schema visualization via Prisma Studio, even after the runtime query layer migrated to `better-sqlite3`. In practice:

- No `schema.prisma` file existed; Studio was non-functional.
- Two orphan files (`src/components/chunks/ChunkCard.tsx`, `src/components/chunks/BrowseContent.tsx`) imported `Chunk`, `Category`, `Mastery` types from `@prisma/client`. The types did not match the actual SQLite schema and the components were not rendered by any page (dead code).
- `package.json` exposed `db:generate`, `db:push`, `db:studio` scripts that never worked.
- `next.config.js` listed `@prisma/client` under `serverComponentsExternalPackages`.

The presence of Prisma artifacts was misleading: contributors assumed schema management existed when it did not.

## Decision

Remove every Prisma reference:

1. Uninstall `@prisma/client` and `prisma` (dev) packages.
2. Drop `db:generate`, `db:push`, `db:studio` scripts.
3. Delete orphan components depending on Prisma types (`ChunkCard.tsx`, `BrowseContent.tsx`).
4. Replace `serverComponentsExternalPackages: ['@prisma/client']` with `['better-sqlite3']` in `next.config.js`.
5. Update `CLAUDE.md` and ADR-001 to reflect that Prisma is gone.

## Consequences

- Smaller install footprint (`prisma` engines, ~30MB).
- No more dead code referencing types that drift from real schema.
- Schema management remains manual: SQL DDL applied directly to `chunks_v1.db`. A future ADR may introduce a lightweight migration tool (e.g. `node-pg-migrate` style, but for SQLite — `umzug` or `kysely-migrations`) when schema churn justifies it.
- Type safety at DB boundary continues to depend on hand-maintained interfaces at the top of `sqlite.ts`.

## Migration Notes

Anyone with a stale local checkout should run `npm install` after pulling to clear the removed packages from `node_modules`.

## Supersedes / Related

- Refines ADR-001 ("Direct SQLite over Prisma"), which had left Prisma half-removed.
