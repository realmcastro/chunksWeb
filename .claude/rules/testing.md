# Rule: Testing

## Governing Agent
**testing-strategist** (sole authority on test methodology)

## Trigger
Creating tests or modifying testable logic.

## Constraints
- Test file co-located with source or in `tests/` subdirectory
- Naming: `{module}.test.ts` or `{Component}.test.tsx`
- Test framework: Vitest (target — not yet installed)
- E2E framework: Playwright (target — not yet installed)

## Structure
```
describe('{ModuleName}', () => {
  describe('{functionName}', () => {
    it('should {expected behavior} when {condition}', () => {});
  });
});
```

## Validations
- [ ] Tests cover happy path + error cases + edge cases
- [ ] No test depends on another test's state
- [ ] No mocking of the database (integration tests hit real SQLite)
- [ ] Assertions are specific (not just "truthy")

## Anti-Patterns
- Testing implementation details instead of behavior
- Snapshot tests for dynamic content
- Tests that pass when feature is broken
- Mocking everything (test means nothing)
