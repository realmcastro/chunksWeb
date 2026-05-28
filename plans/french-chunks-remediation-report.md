# French Chunks Remediation Report

## Summary

| Metric                     | Value          |
| -------------------------- | -------------- |
| Total batch files          | 57             |
| Total chunks               | 855            |
| Chunks needing remediation | **855 (100%)** |
| Chunks per batch           | 15             |
| Batches needed (10/batch)  | 86             |

## Critical Finding

**ALL 855 French chunks** have `patterns` field but are **missing `example_1`, `example_2`, and `example_3`** fields entirely. This is a complete data gap across all batches.

## Level Distribution

| Level     | Chunks Needing Examples |
| --------- | ----------------------- |
| A1        | 81                      |
| A2        | 255                     |
| B1        | 287                     |
| B2        | 213                     |
| C1        | 19                      |
| C2        | 0                       |
| **Total** | **855**                 |

## Affected Files

All 57 `french_chunks_batch*.json` files are affected uniformly:

- [`french_chunks_batch1.json`](scripts/fr/french_chunks_batch1.json) through [`french_chunks_batch57.json`](scripts/fr/french_chunks_batch57.json)
- Each file contains exactly 15 chunks
- Each chunk has `patterns` array but zero example fields

## Batch Remediation Strategy

Given 855 chunks at 10 per batch request:

| Priority | Batches | Files           | Notes       |
| -------- | ------- | --------------- | ----------- |
| 1        | 1-9     | batch1-batch9   | A1-A2 focus |
| 2        | 10-28   | batch10-batch28 | A2-B1 focus |
| 3        | 29-51   | batch29-batch51 | B1-B2 focus |
| 4        | 52-57   | batch52-batch57 | C1 focus    |

## Data Structure Reference

Each chunk requires these 3 example fields added:

```json
{
  "chunk_text": "à tout à l'heure",
  "meaning": "see you later",
  "primary_function": "Social formula for farewell",
  "level": "A1",
  "patterns": ["à + tout + à + l'heure"],
  "collocates": "bonjour, au revoir",
  "example_1": "À tout à l'heure! On se voit à 5h.", // <-- MISSING
  "example_2": "Je te laisse, à tout à l'heure.", // <-- MISSING
  "example_3": "Merci pour aujourd'hui, à tout à l'heure!" // <-- MISSING
}
```

## Remediation Workflow

1. Process in batches of 10-15 chunks (one file per API request)
2. Use existing `patterns` and `meaning` fields to generate contextually appropriate examples
3. Example sentences should:
   - Use the chunk in natural context
   - Vary complexity from simple (example_1) to natural (example_3)
   - Match the CEFR level indicated
4. Preserve all existing fields unchanged

## Files Reference

Analysis script: [`scripts/analyze_french_chunks.py`](scripts/analyze_french_chunks.py)
