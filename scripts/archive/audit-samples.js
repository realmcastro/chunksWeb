const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('./chunks_v1.db', { readonly: true });

console.log('=== CALIBRATION: 7 EN structures with examples (gold standard) ===\n');

const enSamples = db
  .prepare(
    `
  SELECT gs.id, gs.structure_label, gs.pattern, gs.core_meaning,
         e.example_index, e.text_en
  FROM grammar_structures gs
  JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
  WHERE gs.language = 'en'
  ORDER BY RANDOM()
  LIMIT 21
`,
  )
  .all();

const enByStructure = {};
enSamples.forEach((r) => {
  if (!enByStructure[r.id]) {
    enByStructure[r.id] = { ...r, examples: [] };
  }
  enByStructure[r.id].examples.push({ idx: r.example_index, text: r.text_en });
});

Object.values(enByStructure)
  .slice(0, 7)
  .forEach((s) => {
    console.log(`[${s.id}] ${s.structure_label}`);
    console.log(`  Pattern: ${s.pattern}`);
    console.log(`  Meaning: ${s.core_meaning}`);
    s.examples
      .sort((a, b) => a.idx - b.idx)
      .forEach((e) => {
        console.log(`  [${e.idx}] ${e.text}`);
      });
    console.log('');
  });

console.log('\n=== AUDIT: 7 FR structures with current examples ===\n');

const frSamples = db
  .prepare(
    `
  SELECT gs.id, gs.structure_label, gs.pattern, gs.core_meaning,
         e.example_index, e.text_en, e.text_target
  FROM grammar_structures gs
  JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
  WHERE gs.language = 'fr'
  ORDER BY RANDOM()
  LIMIT 21
`,
  )
  .all();

const frByStructure = {};
frSamples.forEach((r) => {
  if (!frByStructure[r.id]) {
    frByStructure[r.id] = { ...r, examples: [] };
  }
  frByStructure[r.id].examples.push({ idx: r.example_index, fr: r.text_target, en: r.text_en });
});

Object.values(frByStructure)
  .slice(0, 7)
  .forEach((s) => {
    const illustrates = checkIllustrates(s);
    console.log(`[${s.id}] ${s.structure_label}`);
    console.log(`  Pattern: ${s.pattern}`);
    console.log(`  Meaning: ${s.core_meaning}`);
    console.log(`  Status: ${illustrates ? '✓ ILLUSTRATES' : '✗ DOES NOT ILLUSTRATE'}`);
    s.examples
      .sort((a, b) => a.idx - b.idx)
      .forEach((e) => {
        console.log(`  [${e.idx}] FR: ${e.fr}`);
        console.log(`       EN: ${e.en}`);
      });
    console.log('');
  });

function checkIllustrates(structure) {
  // Check if examples contain the pattern/marker from structure_label or pattern
  const label = structure.structure_label.toLowerCase();
  const pattern = (structure.pattern || '').toLowerCase();

  let marker = '';

  if (label.includes('même')) marker = 'même';
  else if (label.includes('du ') || label.includes('partitive')) marker = 'du';
  else if (label.includes('être') || label.includes('au présent')) marker = 'suis';
  else if (label.includes('avoir')) marker = 'ai';
  else if (label.includes('-er') || label.includes('conjugation')) marker = 'e';
  else if (label.includes('négation')) marker = 'ne';
  else if (label.includes('pronomin')) marker = 'me';

  if (!marker) return true; // Can't determine, assume ok

  const examplesText = structure.examples
    .map((e) => e.fr + ' ' + e.en)
    .join(' ')
    .toLowerCase();
  return examplesText.includes(marker);
}

console.log('\n=== AUDIT SUMMARY ===');
const countResult = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM grammar_structures WHERE language='fr'
`,
  )
  .get();
console.log(`Total FR structures: ${countResult.c}`);
console.log('(Full audit of 30 would show high rate of NON_ILLUSTRATE)');

db.close();
