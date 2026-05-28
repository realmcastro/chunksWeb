# Plan: Fix "Show Translation" Button on Cards

## Problem Analysis

The "show translation" button exists in `ReviewSession.tsx` but only displays translations when `text_target` data exists in the database. For chunks without stored translations, the button does nothing useful.

**Current behavior:**

- Shows `currentChunk.examples[0].translation` when toggled
- Translation data comes from `text_target` field in database
- No fallback for chunks without stored translations

**Desired behavior:**

- Show translation for any chunk, regardless of database content
- Use client-side translation library (no external API)
- Support English → Portuguese and English → Spanish

## Solution: Client-Side Translation with Pre-loaded Dictionaries

### Option 1: Extend i18n System (Recommended)

Use the existing `i18n/I18nProvider` infrastructure to add chunk translations.

**Approach:**

1. Create translation dictionary files for chunk content (`chunk-translations-pt.json`, `chunk-translations-es.json`)
2. Add chunk translation keys to the I18nProvider
3. Update `useTranslation` to support chunk content translation
4. Modify `ReviewSession.tsx` and chunk cards to use the translation function

**Pros:**

- Uses existing infrastructure
- Works offline
- Consistent with UI translation approach

**Cons:**

- Large translation files for all chunks
- Manual translation data entry required

### Option 2: Use `translate` Library

Install `translate` library that works with pre-loaded language packs.

**Approach:**

1. Install: `npm install translate` or similar
2. Pre-load translation dictionaries
3. Use client-side translation when no stored translation exists

**Pros:**

- Can translate any text dynamically
- Smaller bundle size than pre-translated chunks

**Cons:**

- Quality depends on translation library
- May not be 100% accurate

### Option 3: Hybrid Approach (Best)

**Approach:**

1. Keep existing `text_target` translations as primary
2. Add a fallback client-side translation for missing translations
3. Use `i18next` with chunk-specific translation resources
4. Create a `useChunkTranslation` hook that:
   - First checks for stored `text_target` translation
   - Falls back to client-side dictionary translation
   - Shows original if no translation available

## Implementation Plan

### Step 1: Create Chunk Translation Files

Create `src/lib/i18n/chunk-translations/` with:

- `pt.json` - Portuguese translations for common chunks
- `es.json` - Spanish translations for common chunks

Structure:

```json
{
  "chunk_123": {
    "meaning": "tradução em português",
    "examples": [{ "sentence": "exemplo traduzido" }]
  }
}
```

### Step 2: Extend I18nProvider

Modify `src/lib/i18n/I18nProvider.tsx` to:

- Load chunk translations lazily
- Add `tChunk(chunkId, field)` method for chunk content
- Cache loaded translations for performance

### Step 3: Update ReviewSession.tsx

Modify `src/components/study/ReviewSession.tsx`:

- Import new `useChunkTranslation` hook
- Replace direct `translation` access with translation function
- Handle loading/pending states

### Step 4: Update ChunkCard and BrowseClient

Add translation toggle capability to:

- `src/components/chunks/ChunkCard.tsx`
- `src/components/browse/BrowseClient.tsx`

## Library Recommendations

For client-side translation without API:

1. **`i18next`** (already used) - extend with chunk resources
2. **`react-i18next`** - React bindings for i18next
3. **`translate`** - simple translation library with offline support
4. **`lexilang`** - dictionary-based approach

## Files to Modify

1. `src/lib/i18n/I18nProvider.tsx` - Add chunk translation support
2. `src/lib/i18n/chunk-translations/pt.json` - Portuguese chunk translations
3. `src/lib/i18n/chunk-translations/es.json` - Spanish chunk translations
4. `src/components/study/ReviewSession.tsx` - Use chunk translation
5. `src/components/chunks/ChunkCard.tsx` - Add translation toggle
6. `src/components/browse/BrowseClient.tsx` - Add translation support

## Estimated Effort

- Step 1-2: 2-3 hours
- Step 3-4: 1-2 hours
- Translation data entry: Ongoing (depends on chunk count)

## Recommendation

Use **Option 3 (Hybrid)**:

1. Keep existing stored translations as priority
2. Add `i18next` with chunk-specific resources as fallback
3. Create `useChunkTranslation` hook for consistent API
