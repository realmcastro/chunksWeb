# French Grammar Structures Deduplication Plan

## 1. Current State Summary

| Metric                          | Value                                                    |
| ------------------------------- | -------------------------------------------------------- |
| Total French grammar structures | 404                                                      |
| Confirmed duplicates            | 1                                                        |
| Duplicate pattern               | `"Emphasis with « même »"` appears twice (IDs: 571, 730) |

### Duplicate Details

| Field                   | ID 571 (KEEP)                                               | ID 730 (DELETE)                                                                     |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| source_file             | french_grammar_batch23.json                                 | french_grammar_batch8.json                                                          |
| entry_index             | 1                                                           | 11                                                                                  |
| core_meaning            | "Emphasizing the subject or object with 'même' (even/self)" | "Emphasizes inclusion or intensity, meaning 'even' or 'same'"                       |
| key_variations          | `moi-même\|toi-même\|...` (category-style)                  | `Même lui ne pouvait pas le croire., Je l'ai fait moi-même., ...` (actual examples) |
| common_learner_mistakes | "Confusing même with 'ême'..."                              | "Positioning même incorrectly changes meaning..."                                   |

### Related Table References

| Table               | FK Column                         | References to 571 | References to 730 |
| ------------------- | --------------------------------- | ----------------- | ----------------- |
| inversions          | grammar_structure_id              | 0                 | 0                 |
| chunk_grammar_links | grammar_id                        | 0                 | 0                 |
| examples            | item_type + item_id (polymorphic) | 0                 | 0                 |

**No foreign key dependencies exist for either duplicate ID.**

---

## 2. Deduplication Strategy

### Decision: Keep ID 571, Remove ID 730

**Rationale:**

1. ID 571 has a more complete `core_meaning` field
2. ID 571 has lower ID (earlier import, more established reference)
3. ID 730's `key_variations` with example sentences could be merged into ID 571 before deletion
4. No dependent records require cascading updates

### Pre-deletion Merge (Optional Enhancement)

Before deleting ID 730, consider copying its richer `key_variations` examples into ID 571's record to preserve all data.

---

## 3. Execution Steps

### Step 1: Create Database Backup

```bash
cp chunks_v1.db chunks_v1.db.backup-$(date +%Y%m%d%H%M%S)
```

### Step 2: Verify Current State

```sql
-- Confirm duplicate exists
SELECT id, structure_label, source_file, core_meaning
FROM grammar_structures
WHERE id IN (571, 730);

-- Confirm no FK dependencies
SELECT 'inversions' as tbl, COUNT(*) as cnt FROM inversions WHERE grammar_structure_id IN (571, 730)
UNION ALL
SELECT 'chunk_grammar_links', COUNT(*) FROM chunk_grammar_links WHERE grammar_id IN (571, 730)
UNION ALL
SELECT 'examples', COUNT(*) FROM examples WHERE item_type = 'grammar_structure' AND item_id IN (571, 730);
```

Expected output: All counts = 0

### Step 3: Merge Data (If Desired)

```sql
-- Only if we want to preserve ID 730's key_variations examples in ID 571
UPDATE grammar_structures
SET key_variations = (
    SELECT key_variations FROM grammar_structures WHERE id = 730
), updated_at = strftime('%s', 'now')
WHERE id = 571;
```

### Step 4: Delete Duplicate (ID 730)

```sql
DELETE FROM grammar_structures WHERE id = 730;
```

### Step 5: Verify Deletion

```sql
-- Confirm ID 730 is gone
SELECT COUNT(*) as remaining FROM grammar_structures WHERE id = 730;

-- Confirm ID 571 still exists
SELECT COUNT(*) as kept FROM grammar_structures WHERE id = 571;

-- Confirm only 1 "Emphasis with « même »" remains
SELECT structure_label, COUNT(*) as cnt
FROM grammar_structures
WHERE source_file LIKE 'french_grammar%'
GROUP BY structure_label
HAVING cnt > 1;
```

Expected: 0 remaining, 1 kept, 0 duplicates

---

## 4. Verification Steps

### Post-Deduplication Verification

```javascript
// Node.js verification script
const Database = require('better-sqlite3');
const db = new Database('chunks_v1.db');

const frenchCount = db
  .prepare(
    "SELECT COUNT(*) as count FROM grammar_structures WHERE source_file LIKE 'french_grammar%'",
  )
  .get().count;

const duplicates = db
  .prepare(
    `
    SELECT structure_label, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
    FROM grammar_structures
    WHERE source_file LIKE 'french_grammar%'
    GROUP BY structure_label
    HAVING cnt > 1
`,
  )
  .all();

console.log(`French grammar structures: ${frenchCount}`);
console.log(`Remaining duplicates: ${duplicates.length}`);
duplicates.forEach((d) => console.log(`  "${d.structure_label}": ${d.cnt} times (IDs: ${d.ids})`));

// Verify ID 730 is gone, ID 571 remains
const g571 = db.prepare('SELECT id FROM grammar_structures WHERE id = 571').get();
const g730 = db.prepare('SELECT id FROM grammar_structures WHERE id = 730').get();
console.log(`ID 571 exists: ${!!g571}`);
console.log(`ID 730 exists: ${!!g730}`);

db.close();
```

Expected: 403 French structures, 0 duplicates, ID 571 exists, ID 730 gone.

---

## 5. Additional Findings

### 5.1 Data Quality Observations

1. **Incomplete records**: Both duplicates have many NULL fields (`primary_function`, `key_forms`, `essential_vocabulary`, `why_it_matters`, `common_mistakes`, `slug`, `content_hash`)
2. **Mixed patterns**: Some grammar structures have Chinese characters in labels (e.g., `文章标题:` prefix in IDs 701-719)
3. **Source file inconsistency**: Same `entry_total: 15` but different batch numbers suggests possible import duplication

### 5.2 Potential Future Cleanup

| Issue                                  | Recommendation                       |
| -------------------------------------- | ------------------------------------ |
| Records with `primary_function = NULL` | Review and populate from source data |
| Chinese-prefixed labels                | Clean source files and re-import     |
| Missing `slug` and `content_hash`      | Consider generating for consistency  |

---

## 6. Rollback Procedure

If issues arise:

```sql
-- Restore from backup (replace YYYYMMDDHHMMSS with actual timestamp)
-- First check backup exists, then:
-- COPY chunks_v1.db chunks_v1.db.pre-rollback
-- UPDATE chunks_v1.db FROM backup
```

---

## 7. Execution Checklist

- [ ] Create database backup
- [ ] Verify no FK dependencies on duplicate IDs
- [ ] (Optional) Merge ID 730's key_variations into ID 571
- [ ] Delete ID 730 from grammar_structures
- [ ] Run verification queries
- [ ] Confirm 403 French grammar structures remain
- [ ] Confirm 0 duplicates remain
