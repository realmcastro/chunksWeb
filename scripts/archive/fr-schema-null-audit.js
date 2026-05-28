const Database = require('better-sqlite3');

const db = new Database('./chunks_v1.db', { readonly: true });

const audit = {
  timestamp: new Date().toISOString(),
  language: 'fr',
  tables: {},
};

// Helper to count NULLs vs total
function countNulls(table, column, language = 'fr') {
  const total = db.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE language=?`).get(language);
  const nulls = db
    .prepare(`SELECT COUNT(*) as c FROM ${table} WHERE language=? AND ${column} IS NULL`)
    .get(language);
  const placeholders = db
    .prepare(
      `SELECT COUNT(*) as c FROM ${table} WHERE language=? AND (${column} IS NULL OR ${column} = '' OR ${column} LIKE 'TBD%' OR ${column} LIKE 'Placeholder%' OR ${column} LIKE 'À compléter%')`,
    )
    .get(language);
  return {
    total: total.c,
    nullCount: nulls.c,
    placeholderCount: placeholders.c - nulls.c,
    nullPercent: total.c > 0 ? ((nulls.c / total.c) * 100).toFixed(1) : 0,
    filledPercent: total.c > 0 ? (((total.c - nulls.c) / total.c) * 100).toFixed(1) : 0,
  };
}

// Helper to sample rows with NULL in specific fields
function sampleNulls(table, columns, language = 'fr', limit = 5) {
  const colList = columns.join(', ');
  const query = `
    SELECT id, ${colList}
    FROM ${table}
    WHERE language=?
    ORDER BY RANDOM()
    LIMIT ${limit}
  `;
  return db.prepare(query).all(language);
}

// ============ CHUNKS TABLE ============
console.log('Auditing chunks table...');
const chunksColumns = [
  'meaning',
  'primary_function',
  'communicative_purpose',
  'trigger_situations',
  'contexts',
  'variations',
  'common_mistakes',
  'pattern',
  'typical_collocates',
  'cefr_level_id',
  'register_id',
  'slug',
  'content_hash',
];

const chunksTotal = db.prepare(`SELECT COUNT(*) as c FROM chunks WHERE language='fr'`).get();
audit.tables.chunks = {
  totalRows: chunksTotal.c,
  columns: {},
};

for (const col of chunksColumns) {
  audit.tables.chunks.columns[col] = countNulls('chunks', col);
}

// Sample chunks with NULLs
const chunksWithNulls = db
  .prepare(
    `
  SELECT id, chunk_text, meaning, primary_function, communicative_purpose
  FROM chunks
  WHERE language='fr' AND (
    meaning IS NULL OR 
    primary_function IS NULL OR 
    communicative_purpose IS NULL OR
    trigger_situations IS NULL
  )
  ORDER BY RANDOM()
  LIMIT 5
`,
  )
  .all();
audit.tables.chunks.sampleWithNulls = chunksWithNulls;

// ============ GRAMMAR_STRUCTURES TABLE ============
console.log('Auditing grammar_structures table...');
const grammarColumns = [
  'core_meaning',
  'primary_communicative_fn',
  'when_to_use',
  'pattern',
  'key_variations',
  'essential_vocabulary_slots',
  'common_learner_mistakes',
  'key_forms',
  'slug',
  'content_hash',
];

const grammarTotal = db
  .prepare(`SELECT COUNT(*) as c FROM grammar_structures WHERE language='fr'`)
  .get();
audit.tables.grammar_structures = {
  totalRows: grammarTotal.c,
  columns: {},
};

for (const col of grammarColumns) {
  audit.tables.grammar_structures.columns[col] = countNulls('grammar_structures', col);
}

// Sample grammar with NULLs
const grammarWithNulls = db
  .prepare(
    `
  SELECT id, structure_label, core_meaning, primary_communicative_fn, when_to_use
  FROM grammar_structures
  WHERE language='fr' AND (
    core_meaning IS NULL OR 
    primary_communicative_fn IS NULL OR 
    when_to_use IS NULL
  )
  ORDER BY RANDOM()
  LIMIT 5
`,
  )
  .all();
audit.tables.grammar_structures.sampleWithNulls = grammarWithNulls;

// ============ VOCABULARY_WORDS TABLE ============
console.log('Auditing vocabulary_words table...');
const vocabColumns = [
  'phonetic',
  'part_of_speech',
  'category',
  'subcategory',
  'primary_meaning',
  'secondary_meaning',
  'usage_notes',
  'common_collocations',
  'synonyms',
  'antonyms',
  'image_search_query',
  'example_1',
  'example_1_translation',
];

const vocabTotal = db
  .prepare(`SELECT COUNT(*) as c FROM vocabulary_words WHERE language='fr'`)
  .get();
audit.tables.vocabulary_words = {
  totalRows: vocabTotal.c,
  columns: {},
};

for (const col of vocabColumns) {
  audit.tables.vocabulary_words.columns[col] = countNulls('vocabulary_words', col);
}

// Sample vocab with NULLs
const vocabWithNulls = db
  .prepare(
    `
  SELECT id, word, phonetic, part_of_speech, primary_meaning
  FROM vocabulary_words
  WHERE language='fr' AND (
    phonetic IS NULL OR 
    part_of_speech IS NULL OR 
    primary_meaning IS NULL
  )
  ORDER BY RANDOM()
  LIMIT 5
`,
  )
  .all();
audit.tables.vocabulary_words.sampleWithNulls = vocabWithNulls;

// ============ EXAMPLES TABLE ============
console.log('Auditing examples table...');

// Count examples for FR chunks
const frChunkExamples = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM examples e
  JOIN chunks c ON e.item_id = c.id
  WHERE e.item_type = 'chunk' AND c.language = 'fr'
`,
  )
  .get();

// Count examples for FR grammar
const frGrammarExamples = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM examples e
  JOIN grammar_structures gs ON e.item_id = gs.id
  WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
`,
  )
  .get();

// Check for placeholder examples
const placeholderExamples = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM examples 
  WHERE text_target LIKE 'Phrase exemple%' OR text_en LIKE 'Example sentence%'
`,
  )
  .get();

audit.examples = {
  frenchChunkExamples: frChunkExamples.c,
  frenchGrammarExamples: frGrammarExamples.c,
  totalFrenchExamples: frChunkExamples.c + frGrammarExamples.c,
  placeholderExamples: placeholderExamples.c,
};

// Sample placeholder examples
const placeholderSamples = db
  .prepare(
    `
  SELECT id, item_id, item_type, text_target, text_en
  FROM examples
  WHERE text_target LIKE 'Phrase exemple%' OR text_en LIKE 'Example sentence%'
  LIMIT 5
`,
  )
  .all();
audit.examples.placeholderSamples = placeholderSamples;

db.close();

// Summary stats
audit.summary = {
  chunksNeedFilling: audit.tables.chunks.totalRows,
  grammarNeedFilling: audit.tables.grammar_structures.totalRows,
  vocabNeedFilling: audit.tables.vocabulary_words.totalRows,
};

// Output
const fs = require('fs');
const outputPath = './reports/fr-schema-audit.json';
fs.mkdirSync('./reports', { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(audit, null, 2));
console.log('Saved to', outputPath);

// Also output to console
console.log('\n=== FRENCH CONTENT SCHEMA AUDIT ===');
console.log(`Chunks: ${audit.tables.chunks.totalRows} rows`);
console.log(`Grammar: ${audit.tables.grammar_structures.totalRows} rows`);
console.log(`Vocab: ${audit.tables.vocabulary_words.totalRows} rows`);
console.log(
  `\nExamples: ${audit.examples.totalFrenchExamples} total (${audit.examples.frenchChunkExamples} chunks, ${audit.examples.frenchGrammarExamples} grammar)`,
);
console.log(`Placeholder examples: ${audit.examples.placeholderExamples}`);
