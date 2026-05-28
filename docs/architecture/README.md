# Architecture Documentation

## Contents

### Architecture Decision Records (ADRs)

| ADR | Decision | Status |
|-----|----------|--------|
| [001](decisions/001-direct-sqlite-over-prisma.md) | Direct SQLite (better-sqlite3) over Prisma ORM | Accepted |
| [002](decisions/002-cookie-session-auth.md) | Cookie-based session authentication | Accepted |
| [003](decisions/003-sm2-spaced-repetition.md) | SM-2 algorithm for spaced repetition | Accepted |
| [004](decisions/004-context-api-state-management.md) | React Context API as primary state manager | Accepted |
| [005](decisions/005-pronunciation-subsystem.md) | Layered pronunciation subsystem architecture | Accepted |

### Reference Documents

| Document | Purpose |
|----------|---------|
| [Conventions](conventions.md) | Coding conventions deep reference |
| [Patterns](patterns.md) | Code patterns with examples |
| [Monorepo Migration](monorepo-migration.md) | Future Turborepo migration roadmap |

## Architecture Overview

```
ChunksWeb (Next.js 14 App Router)
├── Presentation Layer
│   ├── Pages (Server Components) — data fetching, auth, layout
│   ├── Client Components — interaction, state, UX
│   └── UI Primitives — Button, Card, Input
├── API Layer
│   └── Route Handlers — auth guard → validate → query → respond
├── Domain Layer
│   ├── SM-2 Algorithm — spaced repetition scheduling
│   ├── Pronunciation — TTS, IPA, G2P engines
│   └── i18n — multi-language support
├── Data Layer
│   ├── SQLite (better-sqlite3) — synchronous query layer
│   └── IndexedDB (Dexie.js) — offline pronunciation cache
└── Infrastructure
    ├── Auth — cookie-based sessions
    ├── Translation — server-side translation service
    └── PWA — service worker, offline support
```

## System Boundaries

```
[Browser] ←→ [Next.js Server] ←→ [SQLite File]
    ↕                                    
[IndexedDB]    [Web Speech API]
(offline)      (pronunciation)
```

## Adding New ADRs

Create `docs/architecture/decisions/NNN-short-title.md` with:

```markdown
# ADR-NNN: Title

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Context
What problem are we solving?

## Decision
What did we decide?

## Rationale
Why this approach over alternatives?

## Trade-offs
What we gain vs what it costs.

## Consequences
What changes as a result?
```

Update this README's ADR table.
