const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'chunks_v1.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

console.log('=== DEDUPLICATION VERIFICATION REPORT ===\n');

// 1. Count of French chunks
const frenchChunksCount = db
  .prepare("SELECT COUNT(*) as cnt FROM chunks WHERE language = 'fr';")
  .get().cnt;
console.log(`1. French chunks count: ${frenchChunksCount}`);
console.log(`   Expected: 889`);
console.log(`   Status: ${frenchChunksCount === 889 ? '✓ PASS' : '✗ FAIL'}\n`);

// 2. Count of unique chunk_text among French chunks
const uniqueTextCount = db
  .prepare("SELECT COUNT(DISTINCT chunk_text) as cnt FROM chunks WHERE language = 'fr';")
  .get().cnt;
console.log(`2. Unique chunk_text among French chunks: ${uniqueTextCount}`);
console.log(`   Expected: 889`);
console.log(`   Status: ${uniqueTextCount === 889 ? '✓ PASS' : '✗ FAIL'}\n`);

// 3. Count of examples linked to French chunks
const examplesCount = db
  .prepare(
    `
    SELECT COUNT(*) as cnt FROM examples 
    WHERE item_type = 'chunk' 
    AND item_id IN (SELECT id FROM chunks WHERE language = 'fr');
`,
  )
  .get().cnt;
console.log(`3. Examples linked to French chunks: ${examplesCount}`);
console.log(`   Expected: 2,808`);
console.log(`   Status: ${examplesCount === 2808 ? '✓ PASS' : '✗ FAIL'}\n`);

// 4. Count of unique chunk IDs that have examples
const uniqueChunkIds = db
  .prepare(
    `
    SELECT COUNT(DISTINCT item_id) as cnt FROM examples 
    WHERE item_type = 'chunk' 
    AND item_id IN (SELECT id FROM chunks WHERE language = 'fr');
`,
  )
  .get().cnt;
console.log(`4. Unique chunk IDs with examples: ${uniqueChunkIds}`);
console.log(`   (Informational - no specific expected value)\n`);

// 5. Orphaned examples (examples pointing to non-existent chunks)
const orphanedCount = db
  .prepare(
    `
    SELECT COUNT(*) as cnt FROM examples 
    WHERE item_type = 'chunk' 
    AND item_id NOT IN (SELECT id FROM chunks);
`,
  )
  .get().cnt;
console.log(`5. Orphaned examples (invalid item_id references): ${orphanedCount}`);
console.log(`   Expected: 0`);
console.log(`   Status: ${orphanedCount === 0 ? '✓ PASS' : '✗ FAIL'}\n`);

// Additional: Check if all French chunks have unique text
const duplicates = db
  .prepare(
    `
    SELECT chunk_text, COUNT(*) as cnt 
    FROM chunks 
    WHERE language = 'fr' 
    GROUP BY chunk_text 
    HAVING cnt > 1;
`,
  )
  .all();

console.log('=== ADDITIONAL INFO ===\n');
console.log(`French chunks with duplicate text: ${duplicates.length}`);
if (duplicates.length > 0) {
  duplicates.slice(0, 5).forEach(({ chunk_text, cnt }) => {
    console.log(`  - '${chunk_text}': ${cnt} occurrences`);
  });
  console.log('');
} else {
  console.log('  None (all French chunk_text values are unique)\n');
}

// Summary
console.log('=== SUMMARY ===');
const allPass =
  frenchChunksCount === 889 &&
  uniqueTextCount === 889 &&
  examplesCount === 2808 &&
  orphanedCount === 0;
console.log(`All critical checks passed: ${allPass ? '✓ YES' : '✗ NO'}`);

db.close();
