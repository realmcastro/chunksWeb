# Translation System Fix - Comprehensive Plan

## Problem Summary

There are TWO separate language concepts in this app:

1. **Learning Language** (`learning_language`) - The language the user is LEARNING (content language)
   - Stored in `user_settings.learning_language`
   - API: `POST /api/user/learning-language` (already exists)
   - Used by: `LearningLanguageContext`

2. **I18n UI Language** (`i18n_language`) - The interface language (UI translations)
   - Stored in localStorage by `I18nProvider` (NOT persisted to DB)
   - Used by: `I18nProvider` for translating UI text (buttons, labels, etc.)

The "Show Translation" button in `VocabFlashcard` needs to:

- Identify the user's **learning language** (from `LearningLanguageContext`)
- Translate the example text TO that language using a translation API

## Files to Create/Modify

### 1. Database Migration

**File:** `src/lib/db/sqlite.ts`

- Add `i18n_language` column to `user_settings` table
- Add `getUserI18nLanguage()` and `setUserI18nLanguage()` functions

### 2. New API Endpoint for I18n Language

**File:** `src/app/api/user/i18n-language/route.ts` (CREATE)

- `GET /api/user/i18n-language` - Returns current I18n language
- `POST /api/user/i18n-language` - Saves I18n language preference

### 3. Translation API

**File:** `src/app/api/translate/route.ts` (CREATE)

- `POST /api/translate` - Translates text to target language
- Uses LibreTranslate or similar free service

### 4. Translation Service (Client-side)

**File:** `src/lib/translation/client.ts` (CREATE)

- Caches translations in localStorage (24h TTL)
- Handles API calls with retry logic

### 5. I18n Provider Enhancement

**File:** `src/lib/i18n/I18nProvider.tsx` (MODIFY)

- Persist I18n language selection to API instead of just localStorage
- Fetch from API on mount

### 6. VocabFlashcard Enhancement

**File:** `src/components/vocabulary/VocabFlashcard.tsx` (MODIFY)

- Use `useLearningLanguage()` to get learning language
- Call translation API to get translation in learning language
- Cache results to avoid repeated API calls

## Database Schema Changes

```sql
ALTER TABLE user_settings ADD COLUMN i18n_language TEXT NOT NULL DEFAULT 'en';
```

New functions in `sqlite.ts`:

- `getUserI18nLanguage(userId: number): string`
- `setUserI18nLanguage(userId: number, language: string): void`

## API Design

### GET/POST /api/user/i18n-language

**Request (POST):**

```json
{ "language": "fr" }
```

**Response:**

```json
{ "language": "fr", "success": true }
```

### POST /api/translate

**Request:**

```json
{
  "text": "Hello, how are you?",
  "targetLanguage": "fr",
  "sourceLanguage": "en"
}
```

**Response:**

```json
{
  "translation": "Bonjour, comment allez-vous?",
  "cached": false
}
```

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              VocabFlashcard                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ useLearningLanguage() ──────────> learningLanguage = 'fr'               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  "Show Translation" clicked                                                  │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ TranslationCache.check(localStorage)                                     │ │
│  │   ├── HIT: return cached translation                                     │ │
│  │   └── MISS: call /api/translate                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
│                              ▼                                               │
│                    POST /api/translate                                       │
│                    { text: "...", targetLanguage: "fr" }                     │
│                              │                                               │
│                              ▼                                               │
│                    ┌─────────────────┐                                      │
│                    │ Translation API │                                      │
│                    │ (LibreTranslate)│                                      │
│                    └─────────────────┘                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Order

1. [ ] Add `i18n_language` column to `user_settings` table in sqlite.ts
2. [ ] Create `getUserI18nLanguage()` and `setUserI18nLanguage()` functions
3. [ ] Create `POST/GET /api/user/i18n-language` endpoint
4. [ ] Create `POST /api/translate` endpoint
5. [ ] Create client-side translation service with caching
6. [ ] Modify `I18nProvider` to persist to API
7. [ ] Modify `VocabFlashcard` to use dynamic translation

## Testing Scenarios

1. User selects French as learning language
2. Opens vocabulary game
3. Clicks "Show Translation" on a flashcard
4. Translation appears in French (not Portuguese)

5. User changes I18n language to Spanish
6. All UI labels change to Spanish
7. Preference persists after refresh (saved to DB)

## Error Handling

- If translation API fails: Show original Portuguese translation as fallback
- If I18n API fails: Fall back to localStorage value
- Network timeout: Retry once, then fallback
