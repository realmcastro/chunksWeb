const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

/*
! AUDIT SCRIPT: Compare JSON data vs DB NULL fields
? For each table, identifies which JSON fields can fill NULL DB columns
*/

const db = new Database('./chunks_v1.db', { readonly: true });

// Load all JSON files
function loadJsonFiles(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const data = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        data.push(...parsed);
      }
    } catch (e) {
      console.error(`Error loading ${file}:`, e.message);
    }
  }
  return data;
}

// Load JSON files with filter
function loadJsonFilesFiltered(dir, filterFn) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && filterFn(f));
  const data = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        data.push(...parsed);
      }
    } catch (e) {
      console.error(`Error loading ${file}:`, e.message);
    }
  }
  return data;
}

// Build lookup maps
console.log('Loading French chunk JSON files...');
const chunkJsons = loadJsonFiles('./scripts/data/fr');
console.log(`Loaded ${chunkJsons.length} chunks from JSON`);

// Build chunk lookup by chunk_text
const chunkMap = {};
for (const c of chunkJsons) {
  chunkMap[c.chunk_text] = c;
}

// Get all French chunks from DB
console.log('\nQuerying DB for French chunks...');
const dbChunks = db.prepare("SELECT * FROM chunks WHERE language='fr'").all();
console.log(`Found ${dbChunks.length} chunks in DB`);

// Analyze what JSON can fill
const chunksAudit = {
  totalInDb: dbChunks.length,
  fields: {},
  canFillSamples: [],
};

// Fields that exist in DB schema but are NULL
const chunksFieldsToCheck = [
  { db: 'variations', json: 'variations', type: 'string' },
  { db: 'common_mistakes', json: 'common_mistakes', type: 'string' },
  { db: 'pattern', json: 'patterns', type: 'array_join' },
  { db: 'typical_collocates', json: 'collocates', type: 'string' },
  { db: 'trigger_situations', json: 'trigger_situations', type: 'string' },
  { db: 'contexts', json: 'contexts', type: 'string' },
  { db: 'communicative_purpose', json: 'communicative_purpose', type: 'string' },
  { db: 'example_1', json: 'example_1', type: 'string' },
  { db: 'example_1_translation', json: 'example_1_translation', type: 'string' },
  { db: 'example_2', json: 'example_2', type: 'string' },
  { db: 'example_2_translation', json: 'example_2_translation', type: 'string' },
  { db: 'example_3', json: 'example_3', type: 'string' },
  { db: 'example_3_translation', json: 'example_3_translation', type: 'string' },
];

for (const field of chunksFieldsToCheck) {
  let canFillCount = 0;
  let alreadyFilledCount = 0;
  const samples = [];

  for (const dbChunk of dbChunks) {
    const isNull =
      dbChunk[field.db] === null || dbChunk[field.db] === undefined || dbChunk[field.db] === '';

    if (!isNull) {
      alreadyFilledCount++;
      continue;
    }

    const jsonChunk = chunkMap[dbChunk.chunk_text];
    if (!jsonChunk) continue;

    let jsonValue = jsonChunk[field.json];
    if (jsonValue === undefined || jsonValue === null || jsonValue === '') continue;

    // For array_join type, convert array to string
    if (field.type === 'array_join' && Array.isArray(jsonValue)) {
      jsonValue = jsonValue.join(', ');
    }

    if (jsonValue && jsonValue !== '') {
      canFillCount++;
      if (samples.length < 3) {
        samples.push({
          chunk_text: dbChunk.chunk_text,
          dbValue: dbChunk[field.db],
          jsonValue: jsonValue,
        });
      }
    }
  }

  chunksAudit.fields[field.db] = {
    canFillCount,
    alreadyFilledCount,
    total: dbChunks.length,
  };
  if (samples.length > 0) {
    chunksAudit.canFillSamples.push({
      field: field.db,
      samples,
    });
  }
}

console.log('\n=== CHUNKS AUDIT ===');
for (const [field, stats] of Object.entries(chunksAudit.fields)) {
  console.log(
    `${field}: can_fill=${stats.canFillCount}, already_filled=${stats.alreadyFilledCount}`,
  );
}

// Now grammar
console.log('\nLoading French grammar JSON files...');
const grammarJsons = loadJsonFilesFiltered('./scripts/data/fr', (f) =>
  f.startsWith('french_grammar_batch'),
);
console.log(`Loaded ${grammarJsons.length} grammar entries from JSON`);

const grammarMap = {};
for (const g of grammarJsons) {
  grammarMap[g.structure_label] = g;
}

console.log('\nQuerying DB for French grammar...');
const dbGrammar = db.prepare("SELECT * FROM grammar_structures WHERE language='fr'").all();
console.log(`Found ${dbGrammar.length} grammar entries in DB`);

const grammarAudit = {
  totalInDb: dbGrammar.length,
  fields: {},
  canFillSamples: [],
};

const grammarFieldsToCheck = [
  { db: 'key_variations', json: 'key_variations', type: 'string' },
  { db: 'essential_vocabulary_slots', json: 'essential_vocabulary_slots', type: 'string' },
  { db: 'pattern', json: 'pattern', type: 'string' },
  { db: 'common_learner_mistakes', json: 'common_learner_mistakes', type: 'string' },
  { db: 'when_to_use', json: 'when_to_use', type: 'string' },
  { db: 'primary_communicative_fn', json: 'primary_communicative_fn', type: 'string' },
  { db: 'example_1', json: 'example_1', type: 'string' },
  { db: 'example_1_translation', json: 'example_1_translation', type: 'string' },
  { db: 'example_2', json: 'example_2', type: 'string' },
  { db: 'example_2_translation', json: 'example_2_translation', type: 'string' },
  { db: 'example_3', json: 'example_3', type: 'string' },
  { db: 'example_3_translation', json: 'example_3_translation', type: 'string' },
];

for (const field of grammarFieldsToCheck) {
  let canFillCount = 0;
  let alreadyFilledCount = 0;
  const samples = [];

  for (const dbEntry of dbGrammar) {
    const isNull =
      dbEntry[field.db] === null || dbEntry[field.db] === undefined || dbEntry[field.db] === '';

    if (!isNull) {
      alreadyFilledCount++;
      continue;
    }

    const jsonEntry = grammarMap[dbEntry.structure_label];
    if (!jsonEntry) continue;

    const jsonValue = jsonEntry[field.json];
    if (jsonValue && jsonValue !== '') {
      canFillCount++;
      if (samples.length < 3) {
        samples.push({
          structure_label: dbEntry.structure_label,
          dbValue: dbEntry[field.db],
          jsonValue: jsonValue,
        });
      }
    }
  }

  grammarAudit.fields[field.db] = {
    canFillCount,
    alreadyFilledCount,
    total: dbGrammar.length,
  };
  if (samples.length > 0) {
    grammarAudit.canFillSamples.push({
      field: field.db,
      samples,
    });
  }
}

console.log('\n=== GRAMMAR AUDIT ===');
for (const [field, stats] of Object.entries(grammarAudit.fields)) {
  console.log(
    `${field}: can_fill=${stats.canFillCount}, already_filled=${stats.alreadyFilledCount}`,
  );
}

// Now vocab
console.log('\nLoading French vocab JSON files...');
const vocabJsons = loadJsonFilesFiltered('./scripts/data/fr', (f) => f.startsWith('french_vocab'));
console.log(`Loaded ${vocabJsons.length} vocab entries from JSON`);

const vocabMap = {};
for (const v of vocabJsons) {
  vocabMap[v.word] = v;
}

console.log('\nQuerying DB for French vocab...');
const dbVocab = db.prepare("SELECT * FROM vocabulary_words WHERE language='fr'").all();
console.log(`Found ${dbVocab.length} vocab entries in DB`);

const vocabAudit = {
  totalInDb: dbVocab.length,
  fields: {},
  canFillSamples: [],
};

const vocabFieldsToCheck = [
  { db: 'phonetic', json: 'phonetic', type: 'string' },
  { db: 'part_of_speech', json: 'part_of_speech', type: 'string' },
  { db: 'category', json: 'category', type: 'string' },
  { db: 'subcategory', json: 'subcategory', type: 'string' },
  { db: 'secondary_meaning', json: 'secondary_meaning', type: 'string' },
  { db: 'usage_notes', json: 'usage_notes', type: 'string' },
  { db: 'common_collocations', json: 'common_collocations', type: 'string' },
  { db: 'synonyms', json: 'synonyms', type: 'string' },
  { db: 'antonyms', json: 'antonyms', type: 'string' },
  { db: 'image_search_query', json: 'image_search_query', type: 'string' },
  { db: 'image_context', json: 'image_context', type: 'string' },
  { db: 'image_tags', json: 'image_tags', type: 'string' },
  { db: 'example_1', json: 'example_1', type: 'string' },
  { db: 'example_1_translation', json: 'example_1_translation', type: 'string' },
  { db: 'example_2', json: 'example_2', type: 'string' },
  { db: 'example_2_translation', json: 'example_2_translation', type: 'string' },
  { db: 'example_3', json: 'example_3', type: 'string' },
  { db: 'example_3_translation', json: 'example_3_translation', type: 'string' },
];

for (const field of vocabFieldsToCheck) {
  let canFillCount = 0;
  let alreadyFilledCount = 0;
  const samples = [];

  for (const dbEntry of dbVocab) {
    const isNull =
      dbEntry[field.db] === null || dbEntry[field.db] === undefined || dbEntry[field.db] === '';

    if (!isNull) {
      alreadyFilledCount++;
      continue;
    }

    const jsonEntry = vocabMap[dbEntry.word];
    if (!jsonEntry) continue;

    const jsonValue = jsonEntry[field.json];
    if (jsonValue && jsonValue !== '') {
      canFillCount++;
      if (samples.length < 3) {
        samples.push({
          word: dbEntry.word,
          dbValue: dbEntry[field.db],
          jsonValue: jsonValue,
        });
      }
    }
  }

  vocabAudit.fields[field.db] = {
    canFillCount,
    alreadyFilledCount,
    total: dbVocab.length,
  };
  if (samples.length > 0) {
    vocabAudit.canFillSamples.push({
      field: field.db,
      samples,
    });
  }
}

console.log('\n=== VOCAB AUDIT ===');
for (const [field, stats] of Object.entries(vocabAudit.fields)) {
  console.log(
    `${field}: can_fill=${stats.canFillCount}, already_filled=${stats.alreadyFilledCount}`,
  );
}

db.close();

// Compile final report
const report = {
  timestamp: new Date().toISOString(),
  language: 'fr',
  phase: 'Phase 1: JSON vs DB Audit',
  chunks: chunksAudit,
  grammar: grammarAudit,
  vocab: vocabAudit,
};

// Write to file
fs.mkdirSync('./reports', { recursive: true });
fs.writeFileSync('./reports/fr-field-completion-audit.json', JSON.stringify(report, null, 2));
console.log('\nSaved report to ./reports/fr-field-completion-audit.json');

// Summary
console.log('\n=== SUMMARY ===');
console.log('CHUNKS:');
console.log(`  Total in DB: ${chunksAudit.totalInDb}`);
for (const [field, stats] of Object.entries(chunksAudit.fields)) {
  if (stats.canFillCount > 0) {
    console.log(`  Can fill ${field}: ${stats.canFillCount} entries`);
  }
}
console.log('\nGRAMMAR:');
console.log(`  Total in DB: ${grammarAudit.totalInDb}`);
for (const [field, stats] of Object.entries(grammarAudit.fields)) {
  if (stats.canFillCount > 0) {
    console.log(`  Can fill ${field}: ${stats.canFillCount} entries`);
  }
}
console.log('\nVOCAB:');
console.log(`  Total in DB: ${vocabAudit.totalInDb}`);
for (const [field, stats] of Object.entries(vocabAudit.fields)) {
  if (stats.canFillCount > 0) {
    console.log(`  Can fill ${field}: ${stats.canFillCount} entries`);
  }
}
