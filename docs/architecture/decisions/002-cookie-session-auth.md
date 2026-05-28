# ADR-002: Cookie-Based Session Authentication

## Status

Accepted — implemented and in production.

## Context

Application needs user authentication for progress tracking, preferences, and study history. Multiple approaches considered: JWT tokens, session cookies, OAuth.

## Decision

Use httpOnly session cookies with 7-day expiry. Session payload stored directly in cookie (userId, username, expiresAt). Password hashing via bcrypt.

Implementation: `src/lib/auth/session.ts`

## Rationale

1. **Simplicity** — No external auth service dependency. No token refresh flow.
2. **Security** — httpOnly cookies not accessible via JavaScript (XSS-safe for token theft).
3. **Offline-first** — Cookie persists without network. Aligns with PWA requirements.
4. **No server session store** — Stateless. No Redis/memory store needed.

## Trade-offs

| Gain | Cost |
|------|------|
| Simple implementation | No role-based access control |
| httpOnly security | Cookie size limited (~4KB) |
| Stateless | No server-side session invalidation |
| No external dependencies | Manual session management |

## Consequences

- Every authenticated API route calls `getUserIdFromCookie()`
- Session expiry is client-side only (cookie expiry)
- No server-side session revocation (logout clears cookie only)
- Default `userId = 1` used for unauthenticated dashboard access

## Risks

- No CSRF protection currently implemented
- Cookie not marked `secure` in development (acceptable)
- No rate limiting on login endpoint
- Password migration from plaintext to bcrypt is in-progress
