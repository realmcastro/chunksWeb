Analyze server/client boundary safety across the codebase.

Scope: $ARGUMENTS (if provided), otherwise all files under `src/`.

## What To Check

### Server Component Safety
For every file in `src/app/` WITHOUT `'use client'`:
- Must not use: useState, useEffect, useRef, useCallback, useMemo, useContext
- Must not use: onClick, onChange, onSubmit, or any event handlers
- Must not use: window, document, localStorage, sessionStorage, navigator
- Must not import from files that use browser APIs

### Client Component Safety
For every file WITH `'use client'`:
- Should not call `getUserIdFromCookie()` or other server-only functions
- Should not import `better-sqlite3` or direct DB modules
- Should not access `process.env` for server secrets
- Should not contain heavy data transformation (delegate to server)

### Hydration Risk
- Check for conditional rendering based on `typeof window !== 'undefined'`
- Check for `useEffect` that modifies DOM immediately (layout shift)
- Check for mismatched server/client output (date formatting, random values)

### Provider Nesting
- Verify provider order in `src/app/layout.tsx`
- Check for unnecessary re-renders from provider value changes
- Flag providers wrapping entire app when only used in subtree

## Output Format

```
[BOUNDARY] file:line — description. Impact: what breaks. Fix: how to resolve.
```

Categories: SERVER_LEAK (server code reaching client), CLIENT_LEAK (client code in server), HYDRATION_RISK, PROVIDER_ISSUE.

End with boundary health summary.
