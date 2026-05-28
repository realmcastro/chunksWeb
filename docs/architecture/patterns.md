# Code Patterns — Reference Guide

## Pattern: Server Page + Client Wrapper

Most pages use a server component for data/auth, delegating interactivity to a `*Client` component.

```typescript
// src/app/browse/page.tsx (Server Component)
import { getUserIdFromCookie } from '@/lib/auth/session';
import { BrowseClient } from '@/components/browse/BrowseClient';

export default async function BrowsePage() {
  const userId = await getUserIdFromCookie();
  // Optional: fetch initial data server-side
  return <BrowseClient userId={userId} />;
}
```

```typescript
// src/components/browse/BrowseClient.tsx (Client Component)
'use client';

interface BrowseClientProps {
  userId: number | null;
}

export function BrowseClient({ userId }: BrowseClientProps) {
  // All interactivity here: state, effects, event handlers
}
```

**When to use:** Any page with user interaction.
**Anti-pattern:** Putting `'use client'` on the page itself.

---

## Pattern: API Route Handler

```typescript
// src/app/api/{domain}/{action}/route.ts
import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { db } from '@/lib/db/sqlite';

export async function POST(request: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  // Validate body fields explicitly

  // Call sqlite.ts function
  const result = db.someQuery(userId, body.param);

  return NextResponse.json(result);
}
```

**Rules:**
- Auth guard first
- Validate input before processing
- Delegate to sqlite.ts for DB operations
- Consistent error shape `{ error: string }`
- Never expose internals in error messages

---

## Pattern: Custom Hook (Single Responsibility)

```typescript
// GOOD: Single concern
function useChunkProgress(chunkId: number) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/progress/${chunkId}`)
      .then(res => res.json())
      .then(setProgress)
      .finally(() => setIsLoading(false));
  }, [chunkId]);

  return { progress, isLoading };
}
```

```typescript
// BAD: Multiple concerns mixed
function useChunkEverything(chunkId: number) {
  // Fetches progress AND plays audio AND tracks analytics AND manages navigation
  // This hook has failed architecturally
}
```

---

## Pattern: Context Provider (Low-Frequency State)

```typescript
// Only for state that changes rarely: auth, theme, language
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Fetch user on mount, provide to tree
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Rules:**
- One context = one domain
- Throw on missing provider (fail fast)
- Only low-frequency updates (theme, auth, i18n)
- Never use as global state for high-frequency data

---

## Pattern: Database Query (sqlite.ts)

```typescript
// Parameterized query — SQL injection safe
function getChunksByCategory(categoryId: number, limit: number = 20, offset: number = 0) {
  const stmt = db.prepare(`
    SELECT c.*, cat.name as category_name
    FROM chunks c
    JOIN categories cat ON c.category_id = cat.id
    WHERE c.category_id = ?
    LIMIT ? OFFSET ?
  `);
  return stmt.all(categoryId, limit, offset) as ChunkRow[];
}
```

**Rules:**
- Always parameterized (never string concatenation)
- Return typed results (cast to interface)
- Group queries by domain within sqlite.ts
- Document non-obvious joins or performance considerations

---

## Pattern: Zod Validation at API Boundary

```typescript
import { z } from 'zod';

const ReviewSubmitSchema = z.object({
  chunkId: z.number().int().positive(),
  quality: z.number().int().min(0).max(5),
  sessionId: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ReviewSubmitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { chunkId, quality, sessionId } = parsed.data;
  // Proceed with validated, typed data
}
```

**When to use:** Every API route that accepts input.
**Note:** Zod is listed in target stack but not yet installed. This pattern is the target for new routes.

---

## Anti-Patterns to Avoid

### Prop Drilling (3+ levels)
```typescript
// BAD: Passing through intermediate components
<GrandParent data={data}>
  <Parent data={data}>
    <Child data={data} />  // data drilled through 2 layers that don't use it
  </Parent>
</GrandParent>

// GOOD: Composition or context
<GrandParent>
  <Child data={data} />  // Skip intermediaries via composition
</GrandParent>
```

### God Component
```typescript
// BAD: 500+ line component doing everything
export function StudyPage() {
  // fetches data, manages state, renders UI, handles audio, tracks analytics...
}

// GOOD: Decompose by responsibility
export function StudyPage() {
  return (
    <StudyLayout>
      <StudyHeader />
      <StudyContent />
      <StudyControls />
    </StudyLayout>
  );
}
```

### Implicit Dependencies
```typescript
// BAD: Function depends on global state silently
function getNextReviewDate() {
  return globalUserProgress.nextReview; // Where does this come from?
}

// GOOD: Explicit parameters
function getNextReviewDate(progress: UserProgress): Date {
  return new Date(progress.nextReview);
}
```
