# Rule: Code Review

## Governing Agent
All agents participate. Each agent reviews its domain:
- **frontend-architect** → architecture, components, hooks, state, rendering, boundary
- **security-auditor** → security violations (CRITICAL always)
- **performance-analyst** → render efficiency, query performance
- **api-integration** → API route compliance
- **observability** → error handling quality
- **testing-strategist** → test coverage adequacy

## Trigger
Running /review or evaluating code changes.

## Checklist

### Critical (blocks merge)
- Security vulnerabilities (XSS, injection, auth bypass)
- Type safety violations (any, unsafe casts)
- Server/client boundary violations
- Data loss risk

### Warning (should fix)
- Missing input validation
- Generic error handling
- Single responsibility violations
- Missing comments on non-obvious logic
- Duplicated logic

### Info (nice to have)
- Naming improvements
- Performance optimization opportunities
- Test coverage gaps

## Output Format
```
file:line — [CRITICAL|WARNING|INFO] finding. Fix: action.
```
