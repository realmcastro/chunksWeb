# Library Layer — Conventions

## Structure

```
src/lib/
├── auth/              # Session management (cookie-based, 7-day expiry)
├── contexts/          # React contexts (LearningLanguageContext)
├── db/                # SQLite query layer (better-sqlite3, ~900+ lines)
├── i18n/              # Internationalization (EN, PT, ES, FR)
├── pronunciation/     # TTS, IPA, G2P engines + hooks + services + storage
├── spaced-repetition/ # SM-2 algorithm implementation
├── translation/       # Translation service client
└── utils/             # Utilities (cn.ts for class merging)
```

## Rules

1. **No Prisma queries** — use `sqlite.ts` direct query pattern exclusively
2. **Single module, single domain** — each directory owns one concern
3. **Explicit exports** — use index.ts barrel files for public API
4. **No cross-domain imports** — `pronunciation/` must not import from `auth/`, etc.
5. **Server/client safety** — mark client-only code. Pronunciation has both server and client-safe variants.

## Database Layer (`db/sqlite.ts`)

This is the single source of truth for all DB operations.

- Synchronous better-sqlite3 `.prepare().get()/.all()/.run()` calls
- All queries are parameterized (SQL injection safe)
- New DB operations go here, not in route handlers
- Interface definitions at top of file match DB schema

## Auth (`auth/session.ts`)

- Cookie name: `session`
- Payload: `{ userId, username, expiresAt }`
- Duration: 7 days
- Flags: httpOnly, sameSite: lax
- `getUserIdFromCookie()` — used by all authenticated API routes

## Pronunciation Subsystem

Complex multi-layer system:

```
engines/    → TTS (Web Speech API), IPA converter, G2P
hooks/      → usePronunciation, useTTSPlayback, useVoiceSettings
services/   → PronunciationService, TTSCoordinator, PhonemeHighlighter
storage/    → IndexedDB cache (phoneticCache, voicePrefs, ttsSettings)
ui/         → PhonemeDisplay, PlaybackControls, IPAVisualizer
```

Has both server-safe and client-safe implementations for SSR compatibility.

## SM-2 Algorithm (`spaced-repetition/sm2.ts`)

- Quality scale: 0–5 (0 = blackout, 5 = perfect)
- Quality ≥ 3 = correct answer
- Intervals: 1 day → 6 days → (easeFactor × previousInterval)
- Minimum ease factor: 1.3
- Mastery levels computed from repetitions + ease

## Adding New Modules

1. Create `src/lib/{domain}/` directory
2. Add types at module level
3. Export public API via `index.ts`
4. Keep internal implementation private
5. Add entry to this file
6. No cross-domain dependencies
