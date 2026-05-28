# Rule: Architecture

## Governing Agent
**frontend-architect** (primary), **api-integration** (API aspects)

## Trigger
Any structural change, new file creation, new module, new feature.

## Constraints
- Single responsibility per file/function/module
- No cross-domain imports between `src/lib/` modules
- No circular dependencies
- Features must be self-contained (application/domain/infrastructure/presentation)
- `sqlite.ts` is the ONLY database access point — no Prisma queries

## Validations
- [ ] New code respects existing module boundaries
- [ ] No file exceeds 500 lines without justification
- [ ] No function exceeds 50 lines without decomposition
- [ ] Dependencies flow downward: pages → components → lib → types

## Anti-Patterns
- God files (multiple unrelated concerns)
- Shared utils without clear ownership
- Implicit cross-module coupling
- Premature abstraction for hypothetical requirements
