const Database = require('better-sqlite3');
const path = require('path');

const dbPath = 'C:/Users/mathe/OneDrive/Documentos/ChunksWeb/chunks_v1.db';
const db = new Database(dbPath, { readonly: true });

const tables = [
  'chunks',
  'grammar_structures',
  'vocabulary_words',
  'examples',
  'categories',
  'cefr_levels',
  'collocations',
  'variations',
  'registers',
];

console.log('=== TABLE SCHEMAS ===\n');
for (const table of tables) {
  console.log(`--- ${table} ---`);
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    console.log(JSON.stringify(cols, null, 2));
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
  console.log();
}

console.log('=== INDEXES WITH SQL ===\n');
const indexes = db
  .prepare(`SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL`)
  .all();
console.log(JSON.stringify(indexes, null, 2));

db.close();
console.log('\nDone.');
