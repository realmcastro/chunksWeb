Create a structured refactoring plan for the specified area.

Target: $ARGUMENTS

## Analysis Phase

### Current State
- Read and understand all files in the target area
- Map dependencies (what imports what)
- Identify the current responsibility of each file/function
- Document existing behavior (inputs → outputs)

### Problem Identification
- Single Responsibility violations
- Excessive coupling between modules
- Duplicated logic
- Overly complex functions (cyclomatic complexity)
- Missing abstractions or premature abstractions
- Type safety gaps
- Test coverage gaps

### Impact Assessment
- What depends on the code being refactored?
- What's the blast radius of changes?
- Can the refactor be done incrementally or is it all-or-nothing?

## Plan Phase

### Declare Before Refactoring
- **Assumptions** — what we believe to be true about the code
- **Invariants** — what must remain true after refactoring
- **Risks** — what could break
- **Trade-offs** — what we gain vs what becomes harder
- **Rollback strategy** — how to undo if things go wrong

### Refactoring Steps

For each step:
1. What changes
2. Why it changes
3. What to verify after the change
4. Dependencies on previous steps

### Migration Path

If the refactor affects public API or interfaces:
- Deprecation strategy
- Backward compatibility period (if needed)
- Callers that need updating

## Output Format

```markdown
## Refactoring Plan: {target}

### Current State
{analysis}

### Problems
{list with severity}

### Proposed Changes
{ordered steps with rationale}

### Risks & Mitigations
{risk table}

### Verification
{how to confirm the refactor is correct}
```

Do NOT execute the refactor. Output the plan only. Wait for approval before implementation.
