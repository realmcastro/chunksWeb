# Rule: Server/Client Boundary

## Governing Agent
**frontend-architect** (structural enforcement), **security-auditor** (secret isolation)

## Trigger
Any file with or without 'use client' directive, imports crossing boundary.

## Constraints

### Server-Only (no directive)
- CAN: fetch data, access DB, read cookies, use fs, access env vars
- CANNOT: useState, useEffect, useRef, event handlers, window, document, localStorage

### Client-Only ('use client')
- CAN: hooks, event handlers, browser APIs, animations
- CANNOT: import better-sqlite3, access server env (except NEXT_PUBLIC_*), getUserIdFromCookie

## Validations
- [ ] No server module imported in client component
- [ ] No browser API used in server component
- [ ] Provider boundary correct in layout.tsx
- [ ] Hydration-safe rendering (no typeof window checks for content)

## Anti-Patterns
- `typeof window !== 'undefined'` for conditional content (causes hydration mismatch)
- Importing `sqlite.ts` in client component
- Using `process.env.SECRET` in 'use client' file
- Entire page marked 'use client' when only a button needs it
