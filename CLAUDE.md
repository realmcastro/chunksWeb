# CLAUDE.md

## Project Overview

**ChunksWeb** — offline-first PWA for English fluency via chunk-based learning + SM-2 spaced repetition.
Stack: Next.js 14 (App Router), TypeScript strict, Tailwind CSS, SQLite (better-sqlite3), React Context, Dexie.js.

## Commands

```bash
npm run dev        # Dev server port 3000 (PWA disabled)
npm run build      # Production build
npm run lint       # ESLint
```

No test suite configured. No CI/CD pipeline.

## Architecture

### Database

- **Direct SQLite via better-sqlite3** — query layer in `src/lib/db/sqlite.ts` (~900+ lines synchronous `.prepare().get()/.all()`). Prisma fully removed (see ADR-006).
- DB file: `chunks_v1.db` at repo root (committed, pre-populated).
- Default `userId = 1` for unauthenticated/global stats.

### API Routes

All under `src/app/api/`. Pattern:

```typescript
export async function POST(request: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  // direct SQLite calls → JSON response
}
```

See `src/app/api/CLAUDE.md` for full API conventions.

### Core Algorithm

`src/lib/spaced-repetition/sm2.ts` — SM-2, quality 0–5. ≥3 = correct. Intervals: 1d → 6d → easeFactor × interval. Min ease: 1.3.

### Study Flow

1. Session via `/api/learn/start` or `/api/review/due`
2. Items from `user_progress` table (SM-2 state)
3. Submit at `/api/review/submit` → SM-2 update

### Pronunciation Subsystem

`src/lib/pronunciation/` — engines (TTS, IPA, G2P), hooks, services, storage (IndexedDB).

### i18n

`src/lib/i18n/` — runtime switching (EN, PT, ES, FR) via `I18nProvider`. Large JSON translation files (~10K+ keys).

### State Management

Priority order (use highest applicable):

1. **Server State** — API routes, RSC data fetching
2. **URL State** — searchParams, pathname
3. **Component State** — useState/useReducer
4. **Zustand** — cross-component client state
5. **React Context** — theme, auth, i18n (low-frequency updates only)

Context API is NOT a global state manager. Currently used for: AuthProvider, I18nProvider, ThemeProvider, LearningLanguageProvider.

## Mandatory Conventions

### Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `ChunkCard`, `ReviewSession` |
| Functions | camelCase | `getUserProgress`, `calculateInterval` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_EASE_FACTOR` |
| Types/Interfaces | PascalCase | `FormattedChunk`, `ProgressStats` |
| Files (components) | PascalCase | `ChunkCard.tsx` |
| Files (utilities) | camelCase | `cn.ts`, `session.ts` |

### Typing

- Explicit types always. Never `any` without formal justification.
- No unsafe casts. No `unknown` without refinement.
- No ambiguous inference at function boundaries.

### Comments

Only for: contracts, invariants, risks, limitations, architectural decisions, non-obvious behavior.

```typescript
/*
! Invariantes, contratos, pré-condições, decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

Contexto de negócio ou propósito arquitetural.
*/
```

NEVER: decorative comments, line-by-line explanations, section markers ("Step 1", "Step 2").

When touching files with uncommented functions, add comments to reduce legacy debt.

### Component Rules

**Server Components** must:

- Fetch data, validate auth, control cache/revalidation, compose layout
- Never use browser APIs, interactivity, or complex visual logic

**Client Components** must:

- Control interaction, visual state, animations, UX
- Never access APIs directly, contain business logic, persistence, or heavy transforms

### Hook Rules

- Single responsibility, single context, predictable behavior
- Prohibited: multifunctional hooks, hooks spanning multiple domains
- If a hook does fetch + transform + cache + analytics + navigation → architecturally broken

### API Integration Rules

All external integrations must have:

- Explicit DTO + Zod schema validation
- Mapper/adapter for normalization
- Timeout + retry policy
- Typed error handling
- Structured logs

Never `fetch` directly in components.

### Security

Required:

- Input sanitization + Zod validation at all API boundaries
- httpOnly cookies for auth (current: 7-day session)
- Server/client boundary: never expose secrets client-side
- Never trust frontend-only validation

Prohibited:

- Tokens in localStorage
- Env vars accessed outside config layer
- Generic error responses leaking internal state

### Performance

Every implementation must consider:

- SSR/streaming/hydration safety
- Lazy loading + bundle splitting
- Render minimization + selective memoization
- Predictable caching
- Image/font optimization

## Feature Structure (Target)

New features follow this structure:

```
src/features/{feature-name}/
├── application/     # Use cases, orchestration
├── domain/          # Business logic, types, validation
├── infrastructure/  # External integrations, data access
├── presentation/    # Components, hooks, UI
└── tests/           # Feature-specific tests
```

No feature may access internals of another feature. Communication via explicit contracts only.

## Code Quality Gates

Before implementation:

- Declare assumptions, risks, invariants, contracts
- Identify trade-offs and architectural impact
- Expose ambiguity before coding

Refuse:

- Multiple responsibilities in single function
- Generic error handling without context
- Duplicated logic
- Implicit language behavior dependency
- Unnecessary complexity or tight coupling

If proposed solution is superficial, insecure, or poorly structured → critique technically before implementing.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/db/sqlite.ts` | Database query layer |
| `src/lib/spaced-repetition/sm2.ts` | SM-2 algorithm |
| `src/app/api/review/submit/route.ts` | Review submission + SM-2 |
| `src/app/layout.tsx` | Root layout + providers |
| `src/app/progress/page.tsx` | Analytics dashboard |
| `src/types/index.ts` | Shared TypeScript interfaces |
| `src/app/globals.css` | CSS variables + dark mode |
| `src/lib/auth/session.ts` | Cookie session management |

## Path Alias

`@/` → `src/` (tsconfig.json)

## Dark Mode

CSS custom properties in `globals.css`, Tailwind `darkMode: 'class'`. Backgrounds: `#fafafa` (light) / `#0a0a0a` (dark).

## Pagination

Offset-based, default limit 20.

## Agent Auto-Routing

When Matheus describes a task, automatically select the most relevant agent from `.claude/agents/registry.md` without asking. Apply that agent's enforced rules throughout execution. Only mention the agent selection if it's genuinely ambiguous.

Routing: match task keywords → select agent → enforce agent's rules → execute.

Security-auditor has veto power over all agents. Multi-domain tasks: primary agent leads, others validate their domain.

See `.claude/agents/registry.md` for full routing table and keyword matching.

## Architecture Reference

See `docs/architecture/` for:

- ADRs (Architecture Decision Records)
- Patterns and conventions deep-dive
- Monorepo migration roadmap
- Component and API pattern guides
