# Rule: API Routes

## Governing Agent
**api-integration** (primary), **security-auditor** (security aspects), **performance-analyst** (query efficiency)

## Trigger
Creating or modifying any `src/app/api/**/route.ts`.

## Constraints
- Auth guard first: `getUserIdFromCookie()` → 401 if missing
- Validate ALL input fields explicitly
- Use `sqlite.ts` for DB — never raw SQL in route files
- Consistent error shape: `{ error: string }`
- Never expose internals in error responses

## Validations
- [ ] Auth check present for authenticated routes
- [ ] Input validated before processing
- [ ] Parameterized queries only (no string concatenation SQL)
- [ ] Appropriate HTTP status codes (400/401/404/500)
- [ ] No business logic in handler — delegate to sqlite.ts or domain functions

## Anti-Patterns
- `catch(err) { return { error: err.message } }` — leaks internals
- Missing auth check on protected route
- `SELECT *` without pagination
- N+1 query patterns
