Analyze performance characteristics of the codebase or specified area.

Scope: $ARGUMENTS (if provided), otherwise key performance areas.

## Analysis Areas

### Rendering
- Identify components with unnecessary re-renders
- Check for inline object/function props creating new references each render
- Verify memoization is used selectively (not excessively)
- Check for expensive computations in render path
- Identify components that should be lazy-loaded

### Bundle Size
- Large dependencies imported in client components
- Tree-shaking opportunities (named imports vs namespace imports)
- Dynamic imports where static isn't needed
- Translation JSON files loaded entirely (could be split)

### Database
- N+1 query patterns in API routes
- Missing indexes for common query patterns
- Large result sets without pagination
- Unnecessary data fetched (SELECT * patterns)
- `sqlite.ts` query efficiency

### Network
- Unnecessary API calls (could be batched or cached)
- Missing cache headers on API responses
- Large payloads that could be paginated
- Sequential requests that could be parallel

### SSR / Hydration
- Components marked `'use client'` that don't need interactivity
- Large client component trees that delay hydration
- Missing Suspense boundaries for streaming
- Static content rendered dynamically

### Images & Assets
- Unoptimized images (next.config has `unoptimized: true`)
- Missing width/height causing layout shift
- Large assets not lazy-loaded
- Font loading strategy

## Output Format

| Area | Finding | Impact | Priority | Fix |
|------|---------|--------|----------|-----|

Impact: HIGH (user-visible latency), MEDIUM (measurable), LOW (theoretical).

End with: top 5 performance improvements ranked by impact/effort ratio.
