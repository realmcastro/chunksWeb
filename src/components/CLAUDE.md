# Components — Conventions

## Directory Structure

```
src/components/
├── ui/          # Base primitives: Button, Card, Input
├── auth/        # Auth-specific: MathCaptcha, SliderCaptcha
├── providers/   # Context providers: AuthProvider, ThemeProvider
├── layout/      # Layout shells: TopNav, Sidebar
├── chunks/      # Chunk display: ChunkCard, ChunkDetailClient, BrowseContent
├── study/       # Study modes: ReviewSession, FeynmanMode
├── grammar/     # Grammar: GrammarClient
├── browse/      # Browse mode: BrowseClient
├── dashboard/   # Dashboard: DashboardClient
├── vocabulary/  # Vocab game: VocabGame, VocabFlashcard, VocabMatchGame, VocabImage
└── [root]       # LanguageSelector, LearningLanguageSelector
```

## Server vs Client Boundary

### Server Components (default in App Router)
- Fetch data, validate auth, control cache/revalidation
- Never: browser APIs, useState, useEffect, event handlers, interactivity

### Client Components (`'use client'` directive)
- Interaction, visual state, animations, UX
- Never: direct API calls to external services, business logic, heavy data transforms
- Data comes from props (passed by server parent) or client-side hooks

## Rules

1. **Single responsibility** — one component, one concern
2. **Props over context** — pass data explicitly when possible
3. **Composition over inheritance** — use children/slots pattern
4. **Typed props** — explicit interface, no inline anonymous types for public components
5. **No `any`** — ever
6. **Naming** — PascalCase files and exports, descriptive names matching purpose
7. **Co-location** — keep related styles, types, utils close to component

## UI Primitives (`ui/`)

Base components must:
- Accept standard HTML attributes via spread
- Support `className` prop for composition
- Use `cn()` from `@/lib/utils/cn` for class merging
- Be presentation-only (no data fetching, no business logic)

## Pattern: Client Wrapper

Pages use server components for data + auth, delegating interactivity to `*Client` components:

```typescript
// page.tsx (Server Component)
export default async function BrowsePage() {
  // auth check, initial data fetch
  return <BrowseClient initialData={data} />;
}

// BrowseClient.tsx ('use client')
export function BrowseClient({ initialData }: Props) {
  // interaction, state, effects
}
```

## Anti-Patterns

- Component doing fetch + transform + render + analytics → split it
- Props drilling 3+ levels → consider composition or context
- Monolithic `*Client` components with 300+ lines → decompose
- Using Context for high-frequency updates → use Zustand or component state
- Importing server-only code in client components → hydration errors
