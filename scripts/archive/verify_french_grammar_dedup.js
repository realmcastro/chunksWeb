const sqlite = require('better-sqlite3');
const db = new sqlite('./chunks_v1.db');

console.log('=== VERIFYING FRENCH GRAMMAR DEDUPLICATION ===\n');

// 1. Check if ID 730 still exists and if ID 571 exists
console.log('1. Checking deleted ID 730 and kept ID 571:');
const id730 = db
  .prepare('SELECT id, structure_label, source_file FROM grammar_structures WHERE id = 730')
  .all();
const id571 = db
  .prepare('SELECT id, structure_label, source_file FROM grammar_structures WHERE id = 571')
  .all();
console.log('  ID 730:', id730.length === 0 ? 'DELETED (correct)' : JSON.stringify(id730));
console.log('  ID 571:', id571.length > 0 ? JSON.stringify(id571[0]) : 'NOT FOUND');

// 2. Check for REAL dangling references to ID 730 in chunk_grammar_links
// chunk_grammar_links columns: chunk_id, grammar_id, link_source
console.log('\n2. Checking for dangling references to deleted ID 730:');

const linksTo730 = db
  .prepare('SELECT COUNT(*) as cnt FROM chunk_grammar_links WHERE grammar_id = 730')
  .get();
console.log(
  '  chunk_grammar_links to grammar_id=730:',
  linksTo730.cnt,
  linksTo730.cnt === 0 ? '(good - no dangling references)' : '(WARNING: dangling reference!)',
);

// 3. Verify ID 571 data integrity
console.log('\n3. Verifying ID 571 data integrity:');
const grammar571 = db.prepare('SELECT * FROM grammar_structures WHERE id = 571').all();
if (grammar571.length > 0) {
  const g = grammar571[0];
  console.log('  All fields:', Object.keys(g).join(', '));
  console.log('  structure_label:', g.structure_label);
  console.log('  core_meaning:', g.core_meaning || 'MISSING');
  console.log('  primary_function:', g.primary_function || 'MISSING');
  console.log('  when_to_use:', g.when_to_use || 'MISSING');
  console.log('  display_order:', g.display_order);
  console.log(
    '  Data complete:',
    g.structure_label && g.core_meaning && g.when_to_use ? 'YES' : 'NO - SOME FIELDS MISSING',
  );
} else {
  console.log('  ERROR: ID 571 not found!');
}

// 4. Check for remaining duplicates (same structure_label in french_grammar)
console.log('\n4. Checking for remaining duplicate structure_labels in French grammar:');
const duplicates = db
  .prepare(
    `
  SELECT structure_label, COUNT(*) as cnt, GROUP_CONCAT(id) as ids, source_file
  FROM grammar_structures 
  WHERE source_file LIKE 'french_grammar%'
  GROUP BY structure_label
  HAVING cnt > 1
`,
  )
  .all();
console.log('  Duplicate count:', duplicates.length);
if (duplicates.length > 0) {
  duplicates.forEach((d) => {
    console.log(
      `    "${d.structure_label}": ${d.cnt} copies (IDs: ${d.ids}) from ${d.source_file}`,
    );
  });
} else {
  console.log('  No duplicates found (good!)');
}

// 5. Final count of French grammar structures
console.log('\n5. Final count of French grammar structures:');
const total = db
  .prepare(
    "SELECT COUNT(*) as cnt FROM grammar_structures WHERE source_file LIKE 'french_grammar%'",
  )
  .get();
console.log('  Total:', total.cnt);

// 6. Check chunk_grammar_links functionality
console.log('\n6. Verifying chunk_grammar_links functionality:');
const cglCount = db.prepare('SELECT COUNT(*) as cnt FROM chunk_grammar_links').get();
console.log('  Total links:', cglCount.cnt);

// Sample some links to verify they work with grammar_id column
const sampleLinks = db
  .prepare(
    `
  SELECT cgl.*, gs.structure_label 
  FROM chunk_grammar_links cgl
  JOIN grammar_structures gs ON cgl.grammar_id = gs.id
  LIMIT 5
`,
  )
  .all();
console.log('  Sample links with grammar labels:', sampleLinks.length);
if (sampleLinks.length > 0) {
  sampleLinks.forEach((l) =>
    console.log('    chunk', l.chunk_id, '-> grammar', l.grammar_id, `(${l.structure_label})`),
  );
}

// 7. Check examples properly link to grammar structures via item_id/item_type
console.log('\n7. Checking examples to grammar_structures linkage:');
const grammarExamples = db
  .prepare("SELECT COUNT(*) as cnt FROM examples WHERE item_type = 'grammar_structure'")
  .get();
console.log('  Examples referencing grammar_structure:', grammarExamples.cnt);

// Check if any grammar_structure example references deleted ID 730
const grammarExamples730 = db
  .prepare(
    "SELECT * FROM examples WHERE item_type = 'grammar_structure' AND (item_id = '730' OR item_id = 730)",
  )
  .all();
console.log(
  '  Grammar examples with item_id=730:',
  grammarExamples730.length,
  grammarExamples730.length === 0 ? '(good)' : '(WARNING: dangling!)',
);

// 8. Summary
console.log('\n=== SUMMARY ===');
console.log('ID 730 deleted:', id730.length === 0 ? 'YES' : 'NO');
console.log('ID 571 accessible:', id571.length > 0 ? 'YES' : 'NO');
console.log('Dangling references:', linksTo730.cnt === 0 ? 'NONE' : linksTo730.cnt);
console.log('Remaining duplicates:', duplicates.length === 0 ? 'NONE' : duplicates.length);
console.log('French grammar structures count:', total.cnt);

console.log('\n=== VERIFICATION COMPLETE ===');
db.close();
