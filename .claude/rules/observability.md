# Rule: Observability

## Governing Agent
**observability** (primary), **security-auditor** (ensures logs don't leak sensitive data)

## Trigger
Error handling, logging, monitoring patterns.

## Constraints
- Structured logs: `{ level, message, context, timestamp }`
- Every caught error must include operational context (userId, action, params)
- Error boundaries for React component trees
- Never swallow errors silently (`catch {}` with no action)

## Validations
- [ ] Errors logged with context (who, what, when)
- [ ] No `console.log` in production code (use structured logger when available)
- [ ] Error boundaries wrap major UI sections
- [ ] API errors return consistent shape + log server-side

## Anti-Patterns
- `catch (e) {}` — silent swallow
- `console.log(error)` without context
- Error messages without action context ("Something went wrong")
- Missing error boundary → white screen of death
