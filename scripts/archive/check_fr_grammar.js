const Database = require('better-sqlite3');
const db = new Database('./chunks_v1.db', { readonly: true });

const frenchStructures = db
  .prepare(
    `
  SELECT id, structure_label, core_meaning, pattern, key_variations
  FROM grammar_structures 
  WHERE language = 'fr'
  ORDER BY id
`,
  )
  .all();

console.log('Total French structures:', frenchStructures.length);
console.log('\nFirst 15:');
console.log(JSON.stringify(frenchStructures.slice(0, 15), null, 2));

db.close();
