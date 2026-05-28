Review the code changes or specified files for architectural compliance, security, and quality.

If $ARGUMENTS is provided, review those specific files or the described scope. Otherwise, review recent uncommitted changes via `git diff`.

## Review Checklist

### Architecture
- [ ] Single responsibility per function/component
- [ ] Server/client boundary respected (no browser APIs in server components, no direct API calls in client components)
- [ ] No cross-domain imports between unrelated modules
- [ ] State management follows priority: Server State > URL State > Component State > Zustand > Context
- [ ] Feature isolation maintained — no reaching into other feature internals

### Typing
- [ ] No `any` without formal justification
- [ ] No unsafe casts or unrefined `unknown`
- [ ] Explicit return types on exported functions
- [ ] Props interfaces defined (not inline anonymous)

### Security
- [ ] Input validated at API boundaries
- [ ] No secrets exposed in client code
- [ ] Auth check present on all authenticated routes
- [ ] No raw user input in SQL (parameterized queries only)
- [ ] Error responses don't leak internal state

### Performance
- [ ] No unnecessary re-renders (check inline object/function props)
- [ ] Heavy components use lazy loading where appropriate
- [ ] Memoization used selectively (not everywhere)
- [ ] Database queries are efficient (check for N+1)

### Code Quality
- [ ] Comment style follows project convention (! ? blocks, Portuguese)
- [ ] Naming follows conventions (PascalCase components, camelCase functions, UPPER_SNAKE_CASE constants)
- [ ] No duplicated logic
- [ ] No generic error handling without context
- [ ] Functions are testable (pure where possible)

### Output Format

For each finding:
```
file:line — [SEVERITY] description. Fix: suggested action.
```

Severities: CRITICAL (blocks merge), WARNING (should fix), INFO (nice to have).

End with summary: total findings by severity, overall assessment.
