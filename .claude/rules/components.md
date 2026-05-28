# Rule: Components

## Governing Agent
**frontend-architect** (primary), **performance-analyst** (performance aspects)

## Trigger
Creating or modifying any React component.

## Constraints

### Server Components (default)
- Fetch data, validate auth, control cache/revalidation
- NEVER: useState, useEffect, useRef, event handlers, browser APIs

### Client Components ('use client')
- Interaction, visual state, animations, UX
- NEVER: direct API calls to external services, business logic, DB access

## Validations
- [ ] Correct 'use client' directive presence/absence
- [ ] Props interface explicitly typed (not inline anonymous)
- [ ] No `any` in props or state
- [ ] Uses `cn()` for Tailwind class merging
- [ ] Single responsibility
- [ ] PascalCase file and export name

## Anti-Patterns
- Component doing fetch + transform + render + analytics
- Props drilling 3+ levels without composition/context
- Monolithic client components (300+ lines)
- Importing server-only code in client components
