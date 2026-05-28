# Rule: Security

## Governing Agent
**security-auditor** (sole authority — security vetoes override all other agents)

## Trigger
Any code change touching: auth, input handling, cookies, env vars, error responses, client/server boundary.

## Constraints
- httpOnly cookies for session tokens
- Input sanitized + validated at EVERY API boundary
- Never expose secrets in client-side code
- Never trust frontend-only validation
- Parameterized SQL queries only
- Error responses: no stack traces, no SQL, no internal paths

## Validations
- [ ] No `any` type on user input
- [ ] No `process.env` access in 'use client' files (except NEXT_PUBLIC_*)
- [ ] No localStorage/sessionStorage for auth tokens
- [ ] XSS vectors sanitized (user-generated content)
- [ ] No raw string interpolation in SQL

## Anti-Patterns
- `eval()` or `new Function()` with user input
- `dangerouslySetInnerHTML` without sanitization
- Generic catch-all returning raw error messages
- Secrets in client bundle
