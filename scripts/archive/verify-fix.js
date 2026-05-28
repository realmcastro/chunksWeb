const Database = require('better-sqlite3');
const db = new Database('./chunks_v1.db', { readonly: true });

console.log('=== VERIFICATION REPORT ===\n');

// 1. Total count
const total = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM examples e
  JOIN grammar_structures gs ON e.item_id = gs.id
  WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
`,
  )
  .get();
console.log('Total FR grammar examples: ' + total.c + ' (expected: 1209)');
console.log('Status: ' + (total.c === 1209 ? '✓ PASS' : '✗ FAIL') + '\n');

// 2. NULL check
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
console.log('NULL/empty values: ' + nullCheck.c + ' (expected: 0)');
console.log('Status: ' + (nullCheck.c === 0 ? '✓ PASS' : '✗ FAIL') + '\n');

// 3. Sample GOOD examples
console.log('=== Sample GOOD examples (IDs 346-360) ===');
const goodSamples = db
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

goodSamples.forEach((s) => {
  console.log('[' + s.id + '] ' + s.structure_label + ' [' + s.example_index + ']:');
  console.log('  FR: ' + s.text_target);
  console.log('  EN: ' + s.text_en);
});

// 4. Sample FALLBACK examples
console.log('\n=== Sample FALLBACK examples (IDs 361-375) ===');
const fallbackSamples = db
  .prepare(
    `
  SELECT gs.id, gs.structure_label, e.example_index, e.text_target, e.text_en
  FROM grammar_structures gs
  JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
  WHERE gs.language = 'fr' AND gs.id BETWEEN 361 AND 375
  ORDER BY gs.id, e.example_index
`,
  )
  .all();

fallbackSamples.forEach((s) => {
  console.log('[' + s.id + '] ' + s.structure_label + ' [' + s.example_index + ']:');
  console.log('  FR: ' + s.text_target);
  console.log('  EN: ' + s.text_en);
});

// 5. Sample random
console.log('\n=== Sample RANDOM (7 structures) ===');
const randomSamples = db
  .prepare(
    `
  SELECT gs.id, gs.structure_label, e.example_index, e.text_target, e.text_en
  FROM grammar_structures gs
  JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
  WHERE gs.language = 'fr'
  ORDER BY RANDOM()
  LIMIT 21
`,
  )
  .all();

const byId = {};
randomSamples.forEach((s) => {
  if (!byId[s.id]) byId[s.id] = { id: s.id, label: s.structure_label, examples: [] };
  byId[s.id].examples.push({ idx: s.example_index, fr: s.text_target, en: s.text_en });
});

Object.values(byId)
  .slice(0, 7)
  .forEach((s) => {
    console.log('\n[' + s.id + '] ' + s.label);
    s.examples
      .sort((a, b) => a.idx - b.idx)
      .forEach((e) => {
        console.log('  [' + e.idx + '] FR: ' + e.fr);
        console.log('       EN: ' + e.en);
      });
  });

db.close();
console.log('\n=== END REPORT ===');
