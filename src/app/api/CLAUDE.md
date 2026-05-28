# API Routes — Conventions

## Route Pattern

Every route handler follows this contract:

```typescript
export async function METHOD(request: Request) {
  const userId = await getUserIdFromCookie(); // src/lib/auth/session.ts
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // 1. Parse + validate input (Zod or manual)
  // 2. Call sqlite.ts query functions
  // 3. Return typed JSON response
}
```

## Rules

- Auth check first. Every authenticated route starts with `getUserIdFromCookie()`.
- Use direct SQLite calls from `src/lib/db/sqlite.ts`. Never Prisma.
- Validate all request body fields. Never trust client input.
- Return consistent error shape: `{ error: string }` with appropriate HTTP status.
- No business logic in route handlers — delegate to `sqlite.ts` or domain functions.
- Pagination: offset-based, default limit 20.

## Error Responses

| Status | When |
|--------|------|
| 400 | Missing/invalid parameters |
| 401 | No session or expired session |
| 404 | Resource not found |
| 500 | Internal error (log context, never expose internals) |

## Existing Routes (31 total)

### Auth (`/auth/`)
- `login` — POST, bcrypt verification, sets session cookie
- `register` — POST, creates user + session
- `logout` — POST, clears session cookie
- `me` — GET, returns current user from session

### Content (`/chunks/`, `/grammar/`)
- `chunks/browse` — GET, paginated with filters (category, search, priority, language)
- `chunks/random` — GET, random chunk selection
- `chunks/by-ids` — POST, batch retrieval
- `grammar/structures` — GET, all structures
- `grammar/structures/[id]` — GET, single structure
- `grammar/structures/[id]/examples` — GET, examples for structure
- `grammar/study` — GET, grammar study session

### Study (`/learn/`, `/review/`, `/quick/`, `/feynman/`)
- `learn/start` — POST, initialize SM-2 state for new chunks
- `learn/categories` — GET, available categories
- `review/due` — GET, chunks due for spaced repetition review
- `review/submit` — POST, quality rating → SM-2 update
- `quick/due` — GET, quick review items
- `feynman/chunks` — GET, chunks for Feynman mode
- `feynman/submit` — POST, Feynman explanation + quality
- `feynman/history` — GET, explanation history
- `feynman/analytics` — GET, Feynman performance stats

### Progress (`/progress/`, `/session/`)
- `progress/stats` — GET, dashboard statistics
- `progress/daily` — GET, daily progress tracking
- `session/end` — POST, record session completion
- `session/activities` — GET, session activity history

### User (`/user/`, `/voice-settings/`, `/translate/`)
- `user/learning-language` — GET/POST, target language preference
- `user/i18n-language` — GET/POST, UI language preference
- `voice-settings` — GET/POST, TTS voice preferences
- `translate` — POST, text translation service

### Vocabulary (`/vocabulary/`)
- `vocabulary` — GET, words with filtering (category, subcategory, CEFR)
- `vocabulary/image` — GET, single image
- `vocabulary/images` — POST, batch images

## Adding New Routes

1. Create `src/app/api/{domain}/{action}/route.ts`
2. Add auth guard if needed
3. Add query function to `sqlite.ts` if new DB access needed
4. Validate inputs explicitly
5. Return typed response
6. Add route to this inventory
