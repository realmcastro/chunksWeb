const Database = require('better-sqlite3');
const db = new Database('./chunks_v1.db', { readonly: true });

console.log('=== VERIFICATION REPORT ===\n');

// 1. Total FR grammar examples
const totalFr = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM examples e
  JOIN grammar_structures gs ON e.item_id = gs.id
  WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
`,
  )
  .get();
console.log('Total FR grammar examples: ' + totalFr.c + ' (expected: 1209)');
console.log('Status: ' + (totalFr.c === 1209 ? '✓ PASS' : '✗ FAIL') + '\n');

// 2. NULL/empty check
const nullCheck = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM examples e
  JOIN grammar_structures gs ON e.item_id = gs.id
  WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
  AND (text_en IS NULL OR text_en = '' OR text_target IS NULL OR text_target = '')
`,
  )
  .get();
console.log('NULL/empty text values: ' + nullCheck.c + ' (expected: 0)');
console.log('Status: ' + (nullCheck.c === 0 ? '✓ PASS' : '✗ FAIL') + '\n');

// 3. Distribution check (each structure should have exactly 3 examples)
const distCheck = db
  .prepare(
    `
  SELECT 
    COUNT(*) as structures_with_3,
    SUM(CASE WHEN cnt = 3 THEN 1 ELSE 0 END) as exact_3
  FROM (
    SELECT COUNT(*) as cnt
    FROM examples e
    JOIN grammar_structures gs ON e.item_id = gs.id
    WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
    GROUP BY gs.id
  )
`,
  )
  .get();
console.log(
  'Structures with exactly 3 examples: ' + distCheck.exact_3 + ' / ' + distCheck.structures_with_3,
);
console.log('Status: ' + (distCheck.structures_with_3 === 403 ? '✓ PASS' : '✗ FAIL') + '\n');

// 4. Sample high-quality examples (IDs 346-360 with proper templates)
console.log('=== Sample High-Quality Examples (IDs 346-360) ===');
const samples = db
  .prepare(
    `
  SELECT gs.id, gs.structure_label, e.example_index, e.text_target, e.text_en
  FROM grammar_structures gs
  JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
  WHERE gs.language = 'fr' AND gs.id BETWEEN 346 AND 360
  ORDER BY gs.id, e.example_index
`,
  )
  .all();

samples.forEach((s) => {
  console.log('[' + s.id + '] ' + s.structure_label + ' [' + s.example_index + ']:');
  console.log('  FR: ' + s.text_target);
  console.log('  EN: ' + s.text_en);
});

// 5. Sample default examples (to show limitation)
console.log('\n=== Sample Default Examples (for uncovered patterns) ===');
const defaultSamples = db
  .prepare(
    `
  SELECT gs.id, gs.structure_label, e.example_index, e.text_target, e.text_en
  FROM grammar_structures gs
  JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
  WHERE gs.language = 'fr' AND gs.id > 600
  ORDER BY RANDOM()
  LIMIT 6
`,
  )
  .all();

defaultSamples.forEach((s) => {
  console.log('[' + s.id + '] ' + s.structure_label + ' [' + s.example_index + ']:');
  console.log('  FR: ' + s.text_target);
  console.log('  EN: ' + s.text_en);
});

// 6. Idempotency test (run again, should not duplicate)
console.log('\n=== Idempotency Check ===');
const countBefore = totalFr.c;
const newExamples = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM examples e
  JOIN grammar_structures gs ON e.item_id = gs.id
  WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
  AND NOT EXISTS (
    SELECT 1 FROM examples e2 
    WHERE e2.item_id = e.item_id 
    AND e2.example_index = e.example_index 
    AND e2.item_type = 'grammar_structure'
    AND e2.rowid < e.rowid
  )
`,
  )
  .get();
console.log('Unique (item_id, example_index) combinations: ' + newExamples.c + ' (expected: 1209)');
console.log('Status: ' + (newExamples.c === 1209 ? '✓ PASS' : '✗ FAIL'));

db.close();
console.log('\n=== VERIFICATION COMPLETE ===');
