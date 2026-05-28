<div align="center">

# ChunksWeb

**Offline-first PWA for English fluency through chunk-based learning and SM-2 spaced repetition.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite)](https://github.com/WiseLibs/better-sqlite3)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?logo=vitest)](https://vitest.dev/)
[![Husky](https://img.shields.io/badge/Husky-9.1-42b883)](https://typicode.github.io/husky/)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Testing](#testing)
- [Git Hooks](#git-hooks)
- [Internationalization](#internationalization)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ChunksWeb is a Progressive Web Application that helps learners reach English fluency through the acquisition of natural language **chunks** (lexical units, collocations, phrasal patterns) rather than isolated vocabulary. Reviews are scheduled by the **SM-2 spaced repetition algorithm**, ensuring optimal retention with minimal study time.

The application is **fully offline-capable**, runs entirely client-side after initial load, and stores all user progress locally with optional sync.

## Key Features

- **Chunk-Based Learning** — Acquire English through high-frequency lexical patterns, not flashcards.
- **SM-2 Spaced Repetition** — Industry-standard algorithm for long-term retention (quality scale 0–5, adaptive intervals).
- **Multiple Study Modes** — Daily review, category focus, free exploration, Feynman explanation, weakness-targeted drills.
- **Pronunciation Engine** — TTS, IPA visualization, G2P (grapheme-to-phoneme) conversion with IndexedDB-cached phonetics.
- **Offline-First PWA** — Service worker, app-shell caching, IndexedDB persistence (Dexie.js).
- **Progress Analytics** — Streaks, mastery distribution, review forecasting, per-category metrics.
- **Multilingual UI** — Runtime switching between EN / PT / ES / FR.
- **Dark Mode** — System preference detection plus manual override.
- **Type-Safe End-to-End** — TypeScript strict, Zod validation at every API boundary.

## Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Framework        | Next.js 14 (App Router, RSC)                    |
| Language         | TypeScript 5.4 (strict mode)                    |
| Styling          | Tailwind CSS 3.4                                |
| Database         | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (synchronous, no ORM) |
| Offline Storage  | IndexedDB via [Dexie.js](https://dexie.org/)    |
| State            | Zustand · React Context · URL state             |
| Validation       | Zod                                             |
| Auth             | Cookie-based sessions (httpOnly, 7-day expiry)  |
| Testing          | [Vitest](https://vitest.dev/) 4.1               |
| Git Hooks        | [Husky](https://typicode.github.io/husky/) 9 + [lint-staged](https://github.com/lint-staged/lint-staged) |
| Linting          | ESLint (`eslint-config-next`)                   |

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ChunksWeb

# Install dependencies (also sets up Husky hooks via "prepare")
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The SQLite database `chunks_v1.db` is pre-populated and committed to the repository — no migration step required.

## Available Scripts

| Command              | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Start Next.js development server (port 3000, PWA off). |
| `npm run build`      | Produce a production build.                            |
| `npm run start`      | Run the production build.                              |
| `npm run lint`       | Run ESLint across the project.                         |
| `npm test`           | Run the Vitest suite once.                             |
| `npm run test:watch` | Run Vitest in watch mode.                              |
| `npm run test:ui`    | Open the interactive Vitest UI.                        |

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # Route handlers (REST endpoints)
│   ├── layout.tsx            # Root layout + providers
│   ├── page.tsx              # Dashboard
│   └── globals.css           # CSS variables + dark-mode tokens
├── components/
│   └── ui/                   # Base UI primitives (Button, Card, Input…)
├── lib/
│   ├── auth/                 # Cookie session management
│   ├── contexts/             # React contexts (theme, i18n, language)
│   ├── db/sqlite.ts          # Single SQLite query layer (~900 lines)
│   ├── i18n/                 # Translation runtime (EN, PT, ES, FR)
│   ├── pronunciation/        # TTS, IPA, G2P engines + hooks
│   ├── spaced-repetition/    # SM-2 algorithm
│   ├── translation/          # Translation service client
│   ├── validation/           # Zod schemas
│   └── utils/                # cn(), helpers
├── types/                    # Shared TypeScript types
└── ...
```

Detailed conventions live in [`CLAUDE.md`](./CLAUDE.md) and the per-directory `*/CLAUDE.md` files.

## Architecture

### Database Layer

All persistence flows through a single, synchronous query module: [`src/lib/db/sqlite.ts`](src/lib/db/sqlite.ts). Queries are parameterized prepared statements — never string concatenation. Prisma was **fully removed** in ADR-006 in favor of direct `better-sqlite3` access for performance and simplicity.

### API Routes

Every route handler under [`src/app/api/`](src/app/api/) follows the same contract:

```typescript
export async function POST(request: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  // 1. Validate input with Zod
  // 2. Delegate to sqlite.ts
  // 3. Return typed JSON
}
```

### Spaced Repetition (SM-2)

Implemented in [`src/lib/spaced-repetition/sm2.ts`](src/lib/spaced-repetition/sm2.ts).

| Quality | Meaning            | Effect on interval                      |
| ------- | ------------------ | --------------------------------------- |
| 0–2     | Incorrect          | Reset to 1 day, lower ease factor       |
| 3       | Correct, hard      | Apply current interval, slight penalty  |
| 4       | Correct, normal    | `interval × easeFactor`                 |
| 5       | Correct, easy      | `interval × easeFactor`, bonus ease     |

Minimum ease factor: **1.3**. Intervals progress `1d → 6d → easeFactor × interval`.

### State Management Priority

1. **Server state** — RSC fetch / API routes
2. **URL state** — `searchParams`, `pathname`
3. **Component state** — `useState` / `useReducer`
4. **Zustand** — cross-component client state
5. **React Context** — low-frequency cross-cutting concerns only (theme, auth, i18n)

## Testing

The project uses **Vitest** with co-located `*.test.ts` files alongside source.

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode (re-runs on save)
npm run test:ui       # Interactive UI at http://localhost:51204/__vitest__/
```

Configuration: [`vitest.config.ts`](vitest.config.ts) — `node` environment, `@/` alias mirrors the TypeScript path mapping.

### Conventions

- File naming: `{module}.test.ts` or `{Component}.test.tsx`
- Test structure: `describe(Module) → describe(function) → it(behavior)`
- Database tests hit real SQLite — **no mocking the DB**
- Cover happy path **and** error cases **and** edge cases

## Git Hooks

Husky enforces quality gates on every commit and push.

| Hook         | Action                                                              |
| ------------ | ------------------------------------------------------------------- |
| `pre-commit` | Runs `lint-staged` → `eslint --fix` on staged `*.ts` / `*.tsx` files |
| `pre-push`   | Runs the full Vitest suite (`npm test`)                             |

Hooks install automatically via the `prepare` script after `npm install`. The configuration lives in [`package.json`](package.json) under the `lint-staged` key and in [`.husky/`](.husky/).

To run the checks manually:

```bash
npx lint-staged    # Same checks the pre-commit hook runs
npm test           # Same checks the pre-push hook runs
```

> Bypass hooks only when strictly necessary (`git commit --no-verify`). They exist to keep `main` green.

## Internationalization

The i18n runtime in [`src/lib/i18n/`](src/lib/i18n/) supports four languages out of the box: **English, Portuguese, Spanish, French**. Switching happens at runtime through `I18nProvider`; no page reload required. Translation files are large JSON dictionaries (~10K+ keys).

## Contributing

1. Create a feature branch off `main`.
2. Follow the conventions in [`CLAUDE.md`](./CLAUDE.md) — naming, typing, server/client boundary, security.
3. Write tests for new logic (especially in `src/lib/`).
4. Ensure `npm test` and `npm run lint` pass locally — the pre-push hook will block otherwise.
5. Open a pull request with a clear description of intent, risks, and validations performed.

## License

[MIT](./LICENSE)

---

<div align="center">
Built with care for English learners who want fluency, not just flashcards.
</div>
