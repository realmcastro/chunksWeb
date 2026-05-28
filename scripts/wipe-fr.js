/*
! FR cascade wipe. Single transaction. Idempotent.
*/
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'chunks_v1.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

const frChunkIds = db.prepare("SELECT id FROM chunks WHERE language='fr'").all().map((r) => r.id);
const frVocabIds = db
  .prepare("SELECT id FROM vocabulary_words WHERE language='fr'")
  .all()
  .map((r) => r.id);
const frGramIds = db
  .prepare("SELECT id FROM grammar_structures WHERE language='fr'")
  .all()
  .map((r) => r.id);

console.log(`FR ids — chunks:${frChunkIds.length} vocab:${frVocabIds.length} grammar:${frGramIds.length}`);

function tempTable(name, ids) {
  db.exec(`CREATE TEMP TABLE ${name}(id INTEGER PRIMARY KEY)`);
  const ins = db.prepare(`INSERT INTO ${name}(id) VALUES (?)`);
  const tx = db.transaction((arr) => {
    for (const v of arr) ins.run(v);
  });
  tx(ids);
}

const wipe = db.transaction(() => {
  tempTable('_fr_chunk', frChunkIds);
  tempTable('_fr_vocab', frVocabIds);
  tempTable('_fr_gram', frGramIds);

  const ops = [
    {
      sql: `DELETE FROM examples WHERE (item_type='chunk' AND item_id IN (SELECT id FROM _fr_chunk)) OR (item_type='grammar_structure' AND item_id IN (SELECT id FROM _fr_gram))`,
      label: 'examples',
    },
    { sql: `DELETE FROM collocations WHERE chunk_id IN (SELECT id FROM _fr_chunk)`, label: 'collocations' },
    { sql: `DELETE FROM variations WHERE chunk_id IN (SELECT id FROM _fr_chunk)`, label: 'variations' },
    { sql: `DELETE FROM colligations WHERE chunk_id IN (SELECT id FROM _fr_chunk)`, label: 'colligations' },
    {
      sql: `DELETE FROM inversions WHERE grammar_structure_id IN (SELECT id FROM _fr_gram)`,
      label: 'inversions',
    },
    {
      sql: `DELETE FROM chunk_grammar_links WHERE chunk_id IN (SELECT id FROM _fr_chunk) OR grammar_id IN (SELECT id FROM _fr_gram)`,
      label: 'chunk_grammar_links',
    },
    { sql: `DELETE FROM chunk_domain_map WHERE chunk_id IN (SELECT id FROM _fr_chunk)`, label: 'chunk_domain_map' },
    {
      sql: `DELETE FROM chunk_relations WHERE source_id IN (SELECT id FROM _fr_chunk) OR target_id IN (SELECT id FROM _fr_chunk)`,
      label: 'chunk_relations',
    },
    { sql: `DELETE FROM user_progress WHERE chunk_id IN (SELECT id FROM _fr_chunk)`, label: 'user_progress' },
    {
      sql: `DELETE FROM feynman_explanations WHERE chunk_id IN (SELECT id FROM _fr_chunk)`,
      label: 'feynman_explanations',
    },
    { sql: `DELETE FROM chunks WHERE language='fr'`, label: 'chunks' },
    { sql: `DELETE FROM vocabulary_words WHERE language='fr'`, label: 'vocabulary_words' },
    { sql: `DELETE FROM grammar_structures WHERE language='fr'`, label: 'grammar_structures' },
  ];

  for (const { sql, label } of ops) {
    const r = db.prepare(sql).run();
    console.log(`  ${label}: ${r.changes} deleted`);
  }

  db.exec('DROP TABLE _fr_chunk');
  db.exec('DROP TABLE _fr_vocab');
  db.exec('DROP TABLE _fr_gram');
});

wipe();

const c = (q) => db.prepare(q).get().n;
console.log('\n=== POST-WIPE FR COUNTS ===');
console.log('chunks fr:', c("SELECT COUNT(*) n FROM chunks WHERE language='fr'"));
console.log('vocabulary_words fr:', c("SELECT COUNT(*) n FROM vocabulary_words WHERE language='fr'"));
console.log('grammar_structures fr:', c("SELECT COUNT(*) n FROM grammar_structures WHERE language='fr'"));
console.log('\n=== EN PRESERVED ===');
console.log('chunks en:', c("SELECT COUNT(*) n FROM chunks WHERE language='en'"));
console.log('vocabulary_words en:', c("SELECT COUNT(*) n FROM vocabulary_words WHERE language='en'"));
console.log('grammar_structures en:', c("SELECT COUNT(*) n FROM grammar_structures WHERE language='en'"));

db.close();
console.log('\nDONE');
