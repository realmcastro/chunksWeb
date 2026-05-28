# Coding Conventions — Deep Reference

This document expands on the conventions listed in `CLAUDE.md`.

## Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase.tsx | `ChunkCard.tsx`, `ReviewSession.tsx` |
| Hooks | camelCase with `use` prefix | `usePronunciation.ts`, `useAuth.ts` |
| Utilities | camelCase.ts | `cn.ts`, `session.ts` |
| Types | camelCase.ts or types.ts | `index.ts` in `src/types/` |
| API routes | `route.ts` in domain directory | `src/app/api/auth/login/route.ts` |
| Pages | `page.tsx` in route directory | `src/app/study/learn/page.tsx` |
| Contexts | PascalCase with Context suffix | `LearningLanguageContext.tsx` |
| Providers | PascalCase with Provider suffix | `AuthProvider.tsx` |

### Code

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `ChunkCard`, `ReviewSession` |
| Props interfaces | PascalCase + Props | `ChunkCardProps`, `ReviewSessionProps` |
| Functions | camelCase | `getUserProgress`, `calculateInterval` |
| Event handlers | handle + Event | `handleSubmit`, `handleQualityChange` |
| Boolean vars | is/has/should prefix | `isLoading`, `hasError`, `shouldRetry` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_EASE_FACTOR` |
| Enums | PascalCase members | `Quality.Perfect`, `MasteryLevel.Expert` |

## Comment Convention

Portuguese-language block comments. Used ONLY for contracts, invariants, and non-obvious behavior.

```typescript
/*
! Invariantes, contratos, pré-condições, decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

Contexto de negócio ou propósito arquitetural (quando aplicável).
*/
```

### When to comment

- Function has preconditions that callers must satisfy
- Business rule is encoded (e.g., SM-2 thresholds)
- Decision has trade-offs that future developers need to understand
- Behavior is surprising or non-obvious

### When NOT to comment

- Function name already explains what it does
- Code is straightforward CRUD
- Decorative separators or section markers
- Line-by-line explanation

## TypeScript Conventions

### Strict Typing

```typescript
// GOOD: explicit types
function calculateInterval(repetitions: number, easeFactor: number): number {
  // ...
}

// BAD: implicit any
function calculateInterval(repetitions, easeFactor) {
  // ...
}
```

### Interface Over Type (for objects)

```typescript
// Preferred for object shapes
interface ChunkCardProps {
  chunk: FormattedChunk;
  onSelect: (id: number) => void;
}

// Type aliases for unions, intersections, primitives
type Quality = 0 | 1 | 2 | 3 | 4 | 5;
type ChunkOrGrammar = FormattedChunk | GrammarStructureItem;
```

### No `any`

If you think you need `any`, use `unknown` with type narrowing:

```typescript
// BAD
function processData(data: any) { ... }

// GOOD
function processData(data: unknown): ProcessedData {
  if (!isValidData(data)) throw new ValidationError('Invalid data shape');
  // data is now narrowed
}
```

## Error Handling

### API Routes

```typescript
// Consistent error response shape
return NextResponse.json({ error: 'Human-readable message' }, { status: 400 });

// Never expose internals
// BAD: return NextResponse.json({ error: err.message, stack: err.stack });
// GOOD: return NextResponse.json({ error: 'Failed to process review' }, { status: 500 });
```

### Client Components

```typescript
// Use error boundaries for unexpected errors
// Use explicit error state for expected failures
const [error, setError] = useState<string | null>(null);

try {
  await submitReview(quality);
} catch (err) {
  setError('Failed to submit review. Please try again.');
  // Log structured error for observability (when logging is available)
}
```

## Import Organization

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { NextResponse } from 'next/server';

// 2. External libraries
import { clsx } from 'clsx';

// 3. Internal modules (absolute imports with @/)
import { getUserIdFromCookie } from '@/lib/auth/session';
import { cn } from '@/lib/utils/cn';

// 4. Relative imports (same feature/module)
import { ChunkCardProps } from './types';
```

## CSS / Tailwind

- Use `cn()` utility for conditional classes
- Dark mode via CSS custom properties (not Tailwind dark: prefix for theme colors)
- Responsive: mobile-first, breakpoints via Tailwind (sm, md, lg)
- Custom spacing/colors defined in `tailwind.config.ts`
- Animations defined in `globals.css`
