# French Chunks Deduplication Plan

## Problem Summary

- 1,785 total French chunks (source_file LIKE 'french_chunks%')
- 889 unique chunk_text values (896 are duplicates)
- 927 French chunks have examples, 858 don't
- This prevents examples from being properly linked to chunks

## Database Structure

- `chunks` table: id, chunk_text, source_file, category_id, language, cefr_level_id
- `examples` table: item_type ('chunk'), item_id (references chunks.id), example_index (1-3), text_en, text_target, is_canonical
- Foreign key: examples.item_id → chunks.id

## Deduplication Strategy

### Step 1: Identify Primary Chunks

- For each duplicate group (same chunk_text), keep the chunk with the LOWEST ID as the primary
- This ensures we keep the oldest, most established entry

### Step 2: Merge Examples

- For each duplicate group:
  a. Find all examples linked to any chunk in the group
  b. Update all example item_id values to point to the primary (lowest ID) chunk
  c. Consolidate example_index (1, 2, 3) - ensure no conflicts

### Step 3: Delete Duplicates

- Delete all duplicate chunks (keeping only the primary)
- Ensure foreign key constraints are handled first

## Execution Steps

1. Create backup of database (optional but recommended)
2. Begin transaction
3. Find all duplicate groups
4. For each group:
   - Get lowest ID as primary
   - Update all examples to point to primary
   - Delete non-primary chunks
5. Commit transaction
6. Verify: Unique chunk_text count should equal total French chunks

## Expected Outcome

- 889 unique French chunks (down from 1,785)
- All 2,808 examples properly linked
- No orphaned examples

## Script Location

The deduplication script will be: scripts/deduplicate_french_chunks.py
