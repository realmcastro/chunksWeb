const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./chunks_v1.db', { readonly: true });

let output = '=== grammar_structures columns ===\n';
output +=
  JSON.stringify(db.prepare('PRAGMA table_info(grammar_structures)').all(), null, 2) + '\n\n';

output += '=== examples columns ===\n';
output += JSON.stringify(db.prepare('PRAGMA table_info(examples)').all(), null, 2) + '\n\n';

output += '=== sample EN structure with examples ===\n';
const enSample = db
  .prepare(
    `
  SELECT gs.id, gs.structure_label, gs.pattern, gs.core_meaning, 
         e.example_index, e.text_en, e.text_target
  FROM grammar_structures gs
  JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
  WHERE gs.language = 'en'
  ORDER BY RANDOM()
  LIMIT 12
`,
  )
  .all();
output += JSON.stringify(enSample.slice(0, 12), null, 2) + '\n\n';

output += '=== sample FR structure with examples ===\n';
const frSample = db
  .prepare(
    `
  SELECT gs.id, gs.structure_label, gs.pattern, gs.core_meaning,
         e.example_index, e.text_en, e.text_target
  FROM grammar_structures gs
  JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
  WHERE gs.language = 'fr'
  ORDER BY RANDOM()
  LIMIT 12
`,
  )
  .all();
output += JSON.stringify(frSample.slice(0, 12), null, 2) + '\n\n';

output += '=== count check ===\n';
const frCount = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM grammar_structures WHERE language='fr'
`,
  )
  .get();
output += 'FR grammar structures: ' + frCount.c + '\n';

const frExCount = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM examples e
  JOIN grammar_structures gs ON e.item_id = gs.id
  WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
`,
  )
  .get();
output += 'FR grammar examples: ' + frExCount.c + '\n';

db.close();

fs.writeFileSync('./schema-audit.json', output, 'utf8');
console.log('Saved to schema-audit.json');
