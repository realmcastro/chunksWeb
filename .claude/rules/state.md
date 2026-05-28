# Rule: State Management

## Governing Agent
**frontend-architect**

## Trigger
Adding or modifying client-side state.

## Constraints — Priority Order
1. **Server State** — RSC data fetching, API routes
2. **URL State** — searchParams, pathname (filters, pagination, search)
3. **Component State** — useState/useReducer (local UI)
4. **Zustand** — cross-component shared state (high-frequency)
5. **Context API** — low-frequency cross-cutting (theme, auth, i18n)

Use highest applicable level. Justify downward escalation.

## Validations
- [ ] State lives at correct level
- [ ] URL-serializable state uses searchParams (filters, page, sort)
- [ ] Context not used for high-frequency updates
- [ ] No global state for component-local concerns
- [ ] No prop drilling when URL or composition solves it

## Anti-Patterns
- Context API as global state manager
- Zustand store for single-component state
- Duplicating server state in client store
- URL state not reflected in URL (breaks back button, sharing)
