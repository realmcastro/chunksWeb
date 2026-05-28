Validate the architectural integrity of the codebase or specified area.

Scope: $ARGUMENTS (if provided), otherwise full `src/` directory.

## Checks

### Boundary Violations
- Scan for imports that cross feature/domain boundaries
- Check client components importing server-only modules
- Check server components using browser APIs or React hooks (useState, useEffect)
- Verify `'use client'` directives are present where needed

### Dependency Direction
- `src/components/` → may import from `src/lib/`, `src/types/`
- `src/app/api/` → may import from `src/lib/`, `src/types/`
- `src/lib/{module}/` → must NOT import from other `src/lib/{other-module}/` unless explicitly shared
- `src/app/` pages → may import from `src/components/`, `src/lib/`
- NO circular dependencies

### State Management
- Verify Context API is only used for low-frequency updates (theme, auth, i18n, language)
- Check for state that should be URL-driven (filters, pagination, search)
- Flag global state used where component state would suffice

### Module Cohesion
- Each `src/lib/` module should have single, clear domain
- Flag files > 500 lines (may need splitting)
- Flag functions > 50 lines (may need decomposition)
- Check `sqlite.ts` for query organization (grouped by domain)

### Component Architecture
- Server/client split follows conventions
- Client wrappers don't duplicate server logic
- UI primitives are presentation-only
- No data fetching in presentational components

## Output

Report as table:

| Area | Status | Violations | Recommendation |
|------|--------|-----------|----------------|

End with architectural health score: HEALTHY / NEEDS ATTENTION / CRITICAL.
