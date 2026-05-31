# CLAUDE.md

## Project Overview

**OLife'S** (formerly ChunksWeb) — offline-first personal LifeOS focused on learning, knowledge management, productivity tracking and self-organization.

Originally built for English fluency via chunk-based learning + SM-2 spaced repetition, the system evolved into a modular personal platform for:

- Language learning
- Programming and abstract study
- Reading (PDF/EPUB/MOBI/TXT)
- Daily journal and planning
- Personal analytics and behavior tracking
- Knowledge management

Primary goal: optimize Matheus' personal workflow, study, memory, and organization through a cohesive offline-first system.

Stack:

- Next.js 14 (App Router)
- TypeScript strict
- Tailwind CSS
- SQLite (`better-sqlite3`)
- React Context
- Zustand
- Dexie.js
- PWA (offline-first)

---

## Architectural Principles

The system is **single-user**, **personal-first**, and **offline-first**.

Architectural decisions prioritize:

1. Fast iteration speed
2. Low operational complexity
3. High personal utility
4. Explicit contracts and predictable behavior
5. Strong modular boundaries
6. Data consistency
7. Searchability and observability

Tradeoffs intentionally accepted:

- Some redundancy over premature abstraction
- Local-first persistence over cloud complexity
- Pragmatic architecture over enterprise ceremony
- Low-scale optimization over hyperscale assumptions

Avoid enterprise overengineering.

---

## Domain Model Direction

The system is **not an English-learning app anymore**.

It is a modular LifeOS composed of domains.

Example domains:

- Study
- Reading
- Journal
- Planning
- Analytics
- Knowledge

English learning is one specialization of the Study domain.

Never hardcode domain assumptions around language learning.

Bad:

```ts
languageId;
speakingSession;
```

Prefer:

```ts
topicId;
studySession;
studyDomain;
```

---

## Core Architecture

### Database

- Direct SQLite via `better-sqlite3`
- Synchronous query layer in `src/lib/db/sqlite.ts`
- DB file: `chunks_v1.db`
- SQLite is source of truth

Primary design principles:

- Explicit queries
- No ORM
- No `SELECT *`
- Avoid hidden abstractions
- Separate metadata from heavy payloads (`BLOB`, large JSON)

Binary assets (books, covers, exported data) may be stored as `BLOB` when operational simplicity outweighs filesystem complexity.

---

### Event-Oriented Design

The platform uses lightweight event-oriented modeling.

Important user actions should be representable as events.

Examples:

```ts
study.session.completed;
reading.progress.updated;
journal.entry.created;
goal.completed;
```

Purpose:

- Analytics
- Timeline/history
- Metrics
- Streaks
- Contextual intelligence
- Future automation

Avoid coupling analytics directly to feature tables.

---

### API Routes

All routes under `src/app/api/`.

Pattern:

```ts
export async function POST(request: Request) {
  const userId = await getUserIdFromCookie();

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // validate input
  // explicit SQLite query
  // JSON response
}
```

Rules:

- Zod validation mandatory
- Explicit DTOs
- No direct DB access in components
- No fetch inside client components
- Auth required unless explicitly public

---

### State Management Priority

Use highest applicable level.

1. Server State
2. URL State
3. Component State (`useState`, `useReducer`)
4. Zustand (cross-component client state)
5. React Context (low-frequency state only)

Context API is not global state.

Current valid use cases:

- Auth
- Theme
- I18n
- Session/UI preferences

---

### Search-First Architecture

Every domain should be designed assuming future global search.

Example:

Search for `redis` should eventually surface:

- Journal notes
- Study content
- Reading highlights
- Goals
- Historical sessions

Avoid siloed data structures that block future indexing.

---

### Tracking Philosophy

System-wide analytics are expected.

Metrics include:

- Gross time (app open)
- Net time (activity-based)
- Session tracking
- Module usage
- Study consistency
- Reading progress
- Behavioral analytics

Inactive tabs must not count as active time.

---

## Feature Structure (Target)

```txt
src/features/{feature-name}/
├── application/
├── domain/
├── infrastructure/
├── presentation/
└── tests/
```

Rules:

- Explicit contracts only
- No feature accessing another feature internals
- Communication through application/domain boundaries

Feature modules should map to domains:

```txt
study/
reading/
journal/
analytics/
planning/
knowledge/
```

---

## Code Quality Gates

Before implementation:

- Declare assumptions
- Declare invariants
- Declare tradeoffs
- Expose ambiguity
- Explain architectural impact

Reject:

- Multiple responsibilities
- Hidden coupling
- Implicit behavior
- Generic errors
- Overengineering
- Premature abstraction

Prefer simple, explicit, evolvable systems.

---

## Key Files

| File                               | Purpose                 |
| ---------------------------------- | ----------------------- |
| `src/lib/db/sqlite.ts`             | SQLite query layer      |
| `src/lib/spaced-repetition/sm2.ts` | SM-2 engine             |
| `src/lib/auth/session.ts`          | Session management      |
| `src/app/layout.tsx`               | Providers and app shell |
| `src/app/progress/page.tsx`        | Analytics dashboard     |
| `src/lib/i18n/`                    | Internationalization    |
| `src/lib/pronunciation/`           | Pronunciation subsystem |
| `src/features/`                    | Domain modules          |

---

## Mental Model

Think:

**Personal modular LifeOS**

Not:

**English-learning SaaS**
