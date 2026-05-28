# Rule: Hooks

## Governing Agent
**frontend-architect**

## Trigger
Creating or modifying any custom React hook.

## Constraints
- Single responsibility, single domain
- Predictable behavior (same inputs → same outputs/effects)
- Name starts with `use` prefix
- Return typed value (explicit return type)

## Validations
- [ ] Hook does ONE thing
- [ ] No mixing: fetch + transform + cache + analytics + navigation in same hook
- [ ] Dependencies array is correct and minimal
- [ ] Cleanup function provided for subscriptions/timers
- [ ] Error state handled

## Anti-Patterns
- `useEverything()` hooks spanning multiple domains
- Hooks with 100+ lines (decompose)
- Hooks that mutate external state without caller awareness
- Generic hooks trying to serve all use cases
