# French Language Expansion Plan

## Current State Analysis

### Tables & Schemas

| Table                | Purpose                | Fields                                                                |
| -------------------- | ---------------------- | --------------------------------------------------------------------- |
| `vocabulary_words`   | Single-word vocabulary | 30 fields including word, phonetic, meaning, examples, synonyms       |
| `chunks`             | Multi-word expressions | 44 fields including chunk_text, meaning, patterns, collocates         |
| `grammar_structures` | Grammar patterns       | 24 fields including structure_label, core_meaning, pattern, key_forms |
| `categories`         | Content organization   | 8 fields including code, name, type, color_hex                        |
| `examples`           | Usage examples         | item_type, item_id, text_en, text_target                              |
| `variations`         | Chunk variants         | chunk_id, variant, note                                               |

### Current Content (English)

- 430 vocabulary words (N2-N7)
- ~200+ chunks (various categories)
- ~50 grammar structures
- i18n: English (en), Spanish (es), Portuguese (pt)

---

## Requirements for French Support

### 1. Database Schema

**No schema changes needed** - existing tables support:

- `text_target` in examples table for non-English examples
- `chunk_text` can store French text
- `meaning` can provide English translations
- `phonetic` field exists for French IPA

### 2. Content Types to Create

#### A. French Vocabulary Words (vocabulary_words table)

**Target: 300-400 words** (CEFR A1-C2)

- French word with IPA phonetic
- English meaning translation
- Example sentences in French with English translations
- Part of speech, CEFR level, category

#### B. French Chunks (chunks table)

**Target: 150-200 chunks**

- French multi-word expressions (e.g., "à tout à l'heure", "qu'est-ce que", "je t'aime")
- English meaning
- Pattern/morphology breakdown
- Collocations, variations, typical contexts

#### C. French Grammar Structures (grammar_structures table)

**Target: 40-60 structures**

- French grammar patterns (e.g., passé composé, subjunctive, pronouns)
- Structure label, core meaning, key variations
- Essential vocabulary slots
- Common learner mistakes

### 3. i18n Support

- Create `fr.json` with all UI strings in French
- Update LanguageSelector component to include French

---

## Orchestration Strategy

Since creating content manually for a new language is massive work, we will use **AI-assisted generation** with varied prompts to avoid duplicates.

### Workflow Phases

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Foundation (Category & i18n Setup)                │
│  - Create French categories                                  │
│  - Create French translations (fr.json)                     │
│  - Verify language selector works                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: Vocabulary (parallel work with distinct prompts)  │
│  - Batch 1: A1-A2 everyday vocabulary (50 words)             │
│  - Batch 2: B1 vocabulary (50 words)                        │
│  - Batch 3: B2 vocabulary (50 words)                        │
│  - Batch 4: C1-C2 advanced vocabulary (50 words)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: Chunks (parallel work with distinct prompts)      │
│  - Batch 1: Greetings & social (20 chunks)                  │
│  - Batch 2: Common expressions (20 chunks)                  │
│  - Batch 3: Phrasal verbs equivalents (20 chunks)            │
│  - Batch 4: Idiomatic expressions (20 chunks)              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: Grammar Structures (parallel work)               │
│  - Batch 1: Verb tenses (10 structures)                     │
│  - Batch 2: Pronouns & agreement (10 structures)             │
│  - Batch 3: Sentence structure (10 structures)              │
│  - Batch 4: Special constructions (10 structures)           │
└─────────────────────────────────────────────────────────────┘
```

### Prompt Variation Strategy (Avoid Duplicates)

Each content batch uses a distinct prompt angle:

1. **Vocabulary prompts** vary by: theme focus, CEFR level, formality level
2. **Chunk prompts** vary by: register (formal/informal), regional variation, semantic field
3. **Grammar prompts** vary by: difficulty level, common errors focus, vs. Spanish/Portuguese contrast

---

## Execution Plan

### Phase 1 Tasks

1. [ ] Create French categories in categories table
2. [ ] Create fr.json with French UI translations
3. [ ] Update LanguageSelector to include French (fr)
4. [ ] Create import script template for French vocabulary

### Phase 2 Tasks (Vocabulary)

5. [ ] Generate A1-A2 French vocabulary batch
6. [ ] Generate B1 French vocabulary batch
7. [ ] Generate B2 French vocabulary batch
8. [ ] Generate C1-C2 French vocabulary batch
9. [ ] Import all batches to vocabulary_words table

### Phase 3 Tasks (Chunks)

10. [ ] Generate French social/greetings chunks
11. [ ] Generate French common expressions chunks
12. [ ] Generate French phrasal equivalents chunks
13. [ ] Generate French idiomatic expressions chunks
14. [ ] Import all French chunks

### Phase 4 Tasks (Grammar)

15. [ ] Generate French verb tense structures
16. [ ] Generate French pronoun structures
17. [ ] Generate French sentence structure patterns
18. [ ] Import all French grammar structures

---

## Technical Notes

### Vocabulary Import Script Pattern

```python
# French vocabulary follows same schema as English
# Key fields:
# - word: French word
# - phonetic: IPA transcription
# - primary_meaning: English translation
# - cefr_level: A1, A2, B1, B2, C1, C2
# - category: thematic category
```

### Chunk Content Strategy

- French chunks should have `chunk_text` in French
- `meaning` in English for learning
- `pattern` breakdown shows French grammar points
- `typical_collocates` shows word connections

### Grammar Structure Strategy

- Labels in French with English explanation
- Key forms show conjugations/declensions
- Common mistakes highlight English speaker errors

---

## Output Files to Create

1. `scripts/import_french_vocabulary.py` - Vocabulary import
2. `scripts/import_french_chunks.py` - Chunk import
3. `scripts/import_french_grammar.py` - Grammar import
4. `src/lib/i18n/translations/fr.json` - UI translations
5. Various batch content JSON files with generated content

---

## Success Criteria

- [ ] French appears in language selector
- [ ] UI displays in French when selected
- [ ] 300+ French vocabulary words in database
- [ ] 150+ French chunks available
- [ ] 40+ French grammar structures available
- [ ] All content follows existing schema patterns
