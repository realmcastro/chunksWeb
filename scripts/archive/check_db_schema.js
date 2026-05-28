const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'chunks_v1.db');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

console.log('=== DATABASE SCHEMA ===\n');

// Get all table names
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
console.log('Tables:', tables.map((t) => t.name).join(', '));

// Check chunks table structure
console.log('\n--- chunks table ---');
const chunksColumns = db.prepare('PRAGMA table_info(chunks);').all();
chunksColumns.forEach((col) => {
  console.log(`  ${col.name} (${col.type})`);
});

// Check examples table structure
console.log('\n--- examples table ---');
const examplesColumns = db.prepare('PRAGMA table_info(examples);').all();
examplesColumns.forEach((col) => {
  console.log(`  ${col.name} (${col.type})`);
});

db.close();
