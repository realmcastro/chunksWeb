# ADR-006 — Feature-based directory migration (`src/features/`)

Status: Accepted (2026-05-21)

## Context

CLAUDE.md prescribes a `src/features/{name}/{application,domain,infrastructure,presentation}/` layout that was never implemented. Code currently lives mixed under `src/app/`, `src/components/`, and `src/lib/`. As features grow, cross-feature imports leak (e.g. study touches DB layer directly, breaking the architecture rule "no cross-domain imports").

## Decision

Migrate one feature at a time, starting with **favorites** as the template.

Each feature exposes a single barrel `index.ts`. Routes and pages MUST import from the barrel only. Internal layers (`domain`, `application`, `infrastructure`, optional `presentation`) are private to the feature.

Dependency direction:

```
presentation  →  application  →  domain
                       ↓
                infrastructure  →  src/lib/db/*
```

`domain` is dependency-free TS. `infrastructure` is the only layer that may touch `src/lib/db/sqlite`. This isolates the DB adapter so swapping (e.g. ADR-007 Turso migration) requires touching only the repository file.

## Consequences

+ Clearer ownership, smaller blast radius for refactors.
+ Test surface per feature is well-defined.
+ Migration is incremental — no big-bang rewrite.
− Short-term duplication while both old and new shapes coexist.
− `sqlite.ts` god-file remains until further ADR splits it by domain.

## Migration order

1. favorites (done — template)
2. chunk-detail (next; consolidates favorites + SM-2 progress + report)
3. study (review/random/errored/dictation/speaking)
4. grammar
5. feynman
6. vocab
7. auth
