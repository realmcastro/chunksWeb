Generate a new component following the project's component conventions.

Component specification: $ARGUMENTS

## Before Generating

Determine:
1. **Server or Client?** — Does it need interactivity? → Client. Pure data display? → Server.
2. **Where does it live?** — `src/components/{domain}/` or `src/features/{feature}/presentation/components/`
3. **What data does it need?** — Props from parent? Hook? Context?
4. **Composition** — What child components does it use?

## Template: Client Component

```typescript
'use client';

/*
! Pre-conditions and contracts for this component.
? Technical description of purpose and behavior.
*/

interface {Component}Props {
  // Explicit prop types
}

export function {Component}({ ...props }: {Component}Props) {
  // Implementation
}
```

## Template: Server Component

```typescript
/*
! Pre-conditions and contracts for this component.
? Technical description of purpose and behavior.
*/

interface {Component}Props {
  // Explicit prop types
}

export default async function {Component}({ ...props }: {Component}Props) {
  // Data fetching, auth, cache control
}
```

## Rules

- PascalCase file name matching component name
- Explicit props interface (not inline)
- `cn()` for Tailwind class merging
- No `any` types
- No business logic in presentation components
- Server components: no hooks, no event handlers, no browser APIs
- Client components: `'use client'` directive at top
- Comment block following project convention (Portuguese)
- Single responsibility
