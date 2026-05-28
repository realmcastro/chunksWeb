Generate the scaffolding for a new feature following the project's feature-based architecture.

Feature name/description: $ARGUMENTS

## What To Generate

### Directory Structure

```
src/features/{feature-name}/
├── application/
│   └── {feature}Service.ts       # Use cases, orchestration
├── domain/
│   ├── types.ts                   # Domain types and interfaces
│   └── validation.ts              # Zod schemas, business rules
├── infrastructure/
│   └── {feature}Repository.ts     # Data access (sqlite.ts queries)
├── presentation/
│   ├── {Feature}Client.tsx        # Main client component ('use client')
│   ├── hooks/
│   │   └── use{Feature}.ts        # Feature-specific hooks
│   └── components/
│       └── {Feature}Card.tsx       # Feature UI components
└── tests/
    └── {feature}.test.ts           # Test stubs (Vitest format)
```

### Required Files Content

1. **types.ts** — Domain interfaces with explicit typing, JSDoc for non-obvious fields
2. **validation.ts** — Zod schemas matching domain types
3. **{feature}Repository.ts** — Data access stub following sqlite.ts patterns
4. **{feature}Service.ts** — Business logic orchestration, pure functions where possible
5. **{Feature}Client.tsx** — Client component with `'use client'`, typed props
6. **use{Feature}.ts** — Hook with single responsibility
7. **tests stub** — Describe blocks for key behaviors

### API Route (if needed)

```
src/app/api/{feature}/{action}/route.ts
```

Following project API pattern: auth guard → validate → query → respond.

### Conventions To Follow

- Comment style: `/*! ? */` blocks in Portuguese
- Explicit typing everywhere
- Single responsibility per file
- No cross-feature imports
- Client/server boundary respected

### Before Generating

Declare:
- Assumptions about the feature's scope
- Required database schema changes (if any)
- Integration points with existing features
- Risks and trade-offs

Then generate the scaffolding.
