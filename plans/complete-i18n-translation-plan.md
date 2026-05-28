# Plan: Complete UI Translation

## Context

The i18n system is partially implemented. Only `/study` page and navbar are using translations. Many other pages and components still have hardcoded English strings that need to be translated.

## Remaining Work

### Pages with Hardcoded Strings

1. **`/` (Dashboard)**
   - "Recent Chunks" / "Recent Grammar Structures"
   - "Categories"
   - Quick action buttons text
   - Stat card labels

2. **`/browse`**
   - Search placeholder
   - Filter labels
   - Pagination text

3. **`/grammar`**
   - Search placeholder
   - Filter labels
   - Pagination text

4. **`/chunk/[id]`**
   - Chunk detail labels
   - Examples section title
   - Related chunks

5. **`/settings`**
   - Theme labels (Light, Dark, System)
   - All settings text

6. **`/login`** - Already mostly uses hardcoded strings
7. **`/register`** - Already mostly uses hardcoded strings

8. **`/study/review`**
   - Completion messages
   - Skip button

9. **`/study/random`**
   - Session complete messages

10. **`/study/learn`**
    - Category selection labels
    - "Surprise Me" text

11. **`/study/feynman`**
    - Completion messages

12. **`/study/quick`**
    - Completion messages

### Components with Hardcoded Strings

- `ReviewSession.tsx` - Quality buttons, flip hint
- `FeynmanMode.tsx` - Intro text, feedback labels
- `ChunkCard.tsx` - Labels
- `BrowseContent.tsx` - Filter/sort labels

### MathCaptcha/SliderCaptcha

- Already have translations, just need to use `t()` function

## Updated Language Selector

User wants flags before language names in selector.

Current: `🇺🇸 English`
Update to: `🇺🇸 English`

Actually already has flags. Just need to ensure it's in all places.

## Translation JSON Structure

Need to expand `en.json`, `pt.json`, `es.json` with all missing keys.

### Required New Keys

```json
{
  "dashboard": {
    "recentChunks": "Recent Chunks",
    "recentGrammar": "Recent Grammar Structures",
    "categories": "Categories",
    "startLearning": "Start Learning",
    "continueWhere": "Continue where you left off",
    "yourProgress": "Your Progress",
    "quickStats": "Quick Stats",
    "totalChunks": "Total Chunks",
    "categoriesCount": "Categories"
  },
  "browse": {
    "searchPlaceholder": "Search chunks...",
    "filters": "Filters",
    "clearFilters": "Clear Filters",
    "resultsCount": "{count} results",
    "noResults": "No chunks found"
  },
  "grammar": {
    "searchPlaceholder": "Search grammar...",
    "structures": "Grammar Structures",
    "noResults": "No structures found"
  },
  "chunk": {
    "examples": "Examples",
    "variations": "Variations",
    "relatedChunks": "Related Chunks",
    "meaning": "Meaning",
    "context": "Context"
  },
  "settings": {
    "title": "Settings",
    "appearance": "Appearance",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "language": "Language"
  },
  "review": {
    "flipCard": "Click to flip",
    "howWasIt": "How was it?",
    "qualityRatings": {
      "again": "Again",
      "hard": "Hard",
      "good": "Good",
      "easy": "Easy"
    },
    "skip": "Skip",
    "sessionComplete": "Session Complete!",
    "chunksReviewed": "You reviewed {count} chunks",
    "noChunks": "You have no chunks to review right now."
  },
  "session": {
    "greatJob": "Great job!",
    "chunksMastered": "{count} chunks mastered!",
    "keepGoing": "Keep going!"
  },
  "learn": {
    "title": "Learn New Chunks",
    "chooseCategory": "Choose a category to start learning",
    "surpriseMe": "Surprise Me!",
    "randomFrom": "Random from {category}"
  }
}
```

## Implementation Steps

### Step 1: Update LanguageSelector

Make sure it shows flags prominently.

### Step 2: Expand Translation JSONs

Add all missing keys to `en.json`, `pt.json`, `es.json`.

### Step 3: Update Each Page

Go through each page and replace hardcoded strings with `t()` calls.

### Pages to Update

1. `src/app/page.tsx` (Dashboard)
2. `src/app/browse/page.tsx`
3. `src/app/grammar/page.tsx`
4. `src/app/chunk/[id]/page.tsx`
5. `src/app/settings/page.tsx`
6. `src/app/login/page.tsx`
7. `src/app/register/page.tsx`
8. `src/app/study/review/page.tsx`
9. `src/app/study/random/page.tsx`
10. `src/app/study/learn/page.tsx`
11. `src/app/study/feynman/page.tsx`
12. `src/app/study/quick/page.tsx`

### Components to Update

1. `src/components/study/ReviewSession.tsx`
2. `src/components/study/FeynmanMode.tsx`
3. `src/components/chunks/ChunkCard.tsx`
4. `src/components/chunks/BrowseContent.tsx`
5. `src/components/auth/MathCaptcha.tsx`
6. `src/components/auth/SliderCaptcha.tsx`

## Files to Modify

| File                                | Changes                              |
| ----------------------------------- | ------------------------------------ |
| `src/lib/i18n/translations/en.json` | Add all missing keys                 |
| `src/lib/i18n/translations/pt.json` | Add all missing keys                 |
| `src/lib/i18n/translations/es.json` | Add all missing keys                 |
| All page files                      | Replace hardcoded strings with `t()` |
| All component files                 | Replace hardcoded strings with `t()` |

## Important Notes

1. **Database content unchanged** - Chunk text, meanings, etc stay as-is
2. **Parameters in strings** - Use `{variableName}` syntax
3. **Pluralization** - Need separate keys for singular/plural or handle in code
4. **Component props** - May need to pass `t` function or use hook inside component

## Test Plan

1. Default language is English
2. Switch to Portuguese - all UI updates
3. Switch to Spanish - all UI updates
4. Refresh page - language persists
5. Database content (chunk text) remains unchanged
