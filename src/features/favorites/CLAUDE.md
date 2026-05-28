# Feature: Favorites

Target shape from CLAUDE.md → `src/features/{feature}/`. Favorites is the **template feature** for the migration.

## Layers

```
favorites/
├── domain/          # FavoriteChunkSummary, FavoritesPage (no IO)
├── application/     # Use cases — orchestrate, validate inputs
├── infrastructure/  # Adapters to src/lib/db/sqlite (repository)
└── index.ts         # Public barrel — only consumers entry point
```

## Rules

- Other features and pages MUST import from `@/features/favorites` (the barrel) only.
- `infrastructure/` may import from `@/lib/db/*` — application/domain may NOT.
- `domain/` is dependency-free TS (no React, no DB, no logger).
- Auth checks happen at the route layer (`getUserId`). Use cases assume `userId` is trusted.

## Migration playbook for the next features

1. Identify the route + page that own the concern.
2. Extract DB calls into `infrastructure/repository.ts` (return DTOs, not rows).
3. Move orchestration to `application/useCases.ts`.
4. Update routes to call use cases via the barrel.
5. Add this CLAUDE.md to the feature directory.

## Status

| Feature | Migrated |
|---------|----------|
| favorites | yes (template) |
| chunk-detail | no |
| study | no |
| grammar | no |
| feynman | no |
| vocab | no |
| auth | no |
