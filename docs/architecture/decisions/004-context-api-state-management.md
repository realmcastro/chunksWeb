# ADR-004: React Context API as Primary Client State Manager

## Status

Accepted — with caveats on future evolution.

## Context

Application needs client-side state management for auth, theme, i18n, and learning language. Zustand is installed but unused. Options: Zustand, Redux, Context API, Jotai.

## Decision

Use React Context API for current state needs. Zustand remains available for future complex client state.

Current contexts:
- `AuthProvider` — user authentication state
- `ThemeProvider` — light/dark mode
- `I18nProvider` — UI language (EN, PT, ES, FR)
- `LearningLanguageProvider` — target learning language

## Rationale

1. **Low-frequency updates** — Auth, theme, and language change rarely. Context re-render cost is negligible.
2. **No external dependency** — Built into React. Zero bundle cost.
3. **Sufficient** — Current state needs are simple key-value stores. No complex derivations or subscriptions.
4. **SSR compatible** — Context works naturally with Next.js App Router.

## Trade-offs

| Gain | Cost |
|------|------|
| Zero bundle impact | Re-renders all consumers on any change |
| Built-in React | No selector optimization |
| Simple mental model | Doesn't scale to complex state |
| SSR natural | Provider nesting can get deep |

## State Management Hierarchy (enforced)

1. Server State (API routes, RSC data fetching)
2. URL State (searchParams, pathname)
3. Component State (useState/useReducer)
4. Zustand (when Context becomes insufficient)
5. Context API (low-frequency cross-cutting concerns)

## When to Migrate to Zustand

- State updates become frequent (>1/second)
- Need selector-based subscriptions (avoid unnecessary re-renders)
- Complex derived state
- State shared across many unrelated components
- Need state persistence beyond Context lifecycle

## Consequences

- Context providers wrap at root layout (`src/app/layout.tsx`)
- Each context owns single domain
- No global "AppState" context
- Zustand migration path is clear (replace context with store, keep hook API similar)
