# Rule: Rendering & Performance

## Governing Agent
**frontend-architect** (rendering strategy), **performance-analyst** (optimization enforcement)

## Trigger
Any component creation, data fetching pattern, or performance-sensitive change.

## Constraints
- Server Components by default — only add 'use client' when interactivity needed
- No inline object/function props in hot render paths (creates new ref each render)
- Lazy load heavy components: `dynamic(() => import(...), { ssr: false })`
- Suspense boundaries for streaming where applicable
- Memoize selectively — not everywhere

## Validations
- [ ] 'use client' boundary is as low as possible in component tree
- [ ] No unnecessary re-renders from unstable references
- [ ] Heavy computation not in render path (useMemo if needed)
- [ ] Images use Next.js Image component with dimensions
- [ ] No blocking resources in critical rendering path

## Anti-Patterns
- `'use client'` on page.tsx (pushes entire subtree to client)
- `useMemo` / `useCallback` on everything (premature optimization)
- Large client component trees delaying hydration
- Fetching data in useEffect when server component could provide it
