const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'chunks_v1.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

console.log('=== DATABASE SCHEMA ANALYSIS ===\n');

// 1. Get all table names
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
console.log('Tables:', tables.map((t) => t.name).join(', '));

// 2. Check grammar_structures table structure
console.log('\n--- grammar_structures table ---');
const grammarColumns = db.prepare('PRAGMA table_info(grammar_structures);').all();
grammarColumns.forEach((col) => {
  console.log(`  ${col.name} (${col.type})`);
});

// 3. Check for foreign keys on grammar_structures
console.log('\n--- Foreign keys referencing grammar_structures ---');
const foreignKeys = db.prepare('PRAGMA foreign_key_list(grammar_structures);').all();
if (foreignKeys.length > 0) {
  foreignKeys.forEach((fk) => {
    console.log(`  ${fk.from} -> ${fk.table}(${fk.to})`);
  });
} else {
  console.log('  No foreign keys on grammar_structures itself');
}

// 4. Check which tables reference grammar_structures
console.log('\n--- Tables with FK to grammar_structures ---');
for (const table of tables.map((t) => t.name)) {
  const fks = db.prepare(`PRAGMA foreign_key_list(${table});`).all();
  const refs = fks.filter((fk) => fk.table === 'grammar_structures');
  if (refs.length > 0) {
    console.log(`  ${table}:`);
    refs.forEach((fk) => {
      console.log(`    ${fk.from} -> grammar_structures(${fk.to})`);
    });
  }
}

// 5. Count French grammar structures
console.log('\n--- French Grammar Structures ---');
const frenchCount = db
  .prepare(
    "SELECT COUNT(*) as count FROM grammar_structures WHERE source_file LIKE 'french_grammar%';",
  )
  .get();
console.log(`Total French grammar structures: ${frenchCount.count}`);

// 6. List all French grammar structures
console.log('\n--- All French Grammar Structures ---');
const frenchStructures = db
  .prepare(
    "SELECT id, structure_label, primary_function, source_file FROM grammar_structures WHERE source_file LIKE 'french_grammar%' ORDER BY structure_label;",
  )
  .all();
frenchStructures.forEach((s) => {
  console.log(`  [${s.id}] ${s.structure_label} (${s.primary_function}) - ${s.source_file}`);
});

// 7. Find duplicates by structure_label
console.log('\n--- Duplicate structure_labels in French Grammar ---');
const duplicates = db
  .prepare(
    `SELECT structure_label, COUNT(*) as count, GROUP_CONCAT(id) as ids
     FROM grammar_structures
     WHERE source_file LIKE 'french_grammar%'
     GROUP BY structure_label
     HAVING COUNT(*) > 1;`,
  )
  .all();
if (duplicates.length > 0) {
  duplicates.forEach((d) => {
    console.log(`  "${d.structure_label}" appears ${d.count} times (IDs: ${d.ids})`);
  });
} else {
  console.log('  No duplicates found');
}

// 8. Check for chunk_examples table (or examples)
console.log('\n--- chunk_examples table (or examples if not exists) ---');
const examplesTableName =
  db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%examples%';")
    .all()[0]?.name || 'examples';
const examplesColumns = db.prepare(`PRAGMA table_info(${examplesTableName});`).all();
examplesColumns.forEach((col) => {
  console.log(`  ${col.name} (${col.type})`);
});

// Check for grammar_structure_id in chunk_examples
const hasGrammarFK = examplesColumns.some((col) => col.name === 'grammar_structure_id');
console.log(`\n  chunk_examples has grammar_structure_id FK: ${hasGrammarFK}`);

// 9. Check if chunk_examples references grammar_structures
console.log('\n--- chunk_examples FK to grammar_structures ---');
const chunkExamplesFKs = db.prepare(`PRAGMA foreign_key_list(${examplesTableName});`).all();
const grammarRefs = chunkExamplesFKs.filter((fk) => fk.table === 'grammar_structures');
if (grammarRefs.length > 0) {
  grammarRefs.forEach((fk) => {
    console.log(`  chunk_examples.${fk.from} -> grammar_structures(${fk.to})`);
  });
} else {
  console.log('  No direct FK from chunk_examples to grammar_structures');
}

db.close();
console.log('\n=== ANALYSIS COMPLETE ===');
