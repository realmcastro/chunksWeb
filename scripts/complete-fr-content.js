/*
! French Content Completion Script - Phases 2-6
? Completes all NULL/empty fields in DB from JSON data
! Uses prepared statements 100%, idempotent operations
*/

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'chunks_v1.db');
const FR_CHUNKS_DIR = path.join(__dirname, 'fr');
const FR_GRAMMAR_DIR = path.join(__dirname, 'fr');
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'fr-completion-report.json');

console.log('\n=== FRENCH CONTENT COMPLETION ===\n');

/*
? Open DB with WAL mode
*/
const db = new Database(DB_PATH, { verbose: null });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/*
? Prepared statements
*/
const stmts = {
  // Get chunk by text and language
  getChunkByText: db.prepare(`
    SELECT id, variations, common_mistakes, typical_collocates, trigger_situations, contexts, communicative_purpose
    FROM chunks WHERE chunk_text = ? AND language = 'fr' LIMIT 1
  `),

  // Get grammar by structure_label
  getGrammarByLabel: db.prepare(`
    SELECT id, essential_vocabulary_slots FROM grammar_structures WHERE structure_label = ? AND language = 'fr' LIMIT 1
  `),

  // Update grammar essential_vocabulary_slots if NULL/empty
  updateGrammarSlots: db.prepare(`
    UPDATE grammar_structures SET essential_vocabulary_slots = ?
    WHERE id = ? AND (essential_vocabulary_slots IS NULL OR essential_vocabulary_slots = '')
  `),

  // Get grammar changes count
  getChanges: db.prepare(`SELECT changes() as count`),

  // Delete examples for chunk (idempotent)
  deleteExamplesByChunk: db.prepare(
    `DELETE FROM examples WHERE item_type = 'chunk' AND item_id = ?`,
  ),

  // Insert example
  insertExample: db.prepare(`
    INSERT INTO examples (item_type, item_id, example_index, text_en, text_target, created_at)
    VALUES ('chunk', @item_id, @example_index, @text_en, @text_target, @created_at)
  `),

  // Delete collocations for chunk
  deleteCollocationsByChunk: db.prepare(`DELETE FROM collocations WHERE chunk_id = ?`),

  // Insert collocation
  insertCollocation: db.prepare(`
    INSERT INTO collocations (chunk_id, word, strength) VALUES (@chunk_id, @word, @strength)
  `),

  // Delete variations for chunk
  deleteVariationsByChunk: db.prepare(`DELETE FROM variations WHERE chunk_id = ?`),

  // Insert variation
  insertVariation: db.prepare(`
    INSERT INTO variations (chunk_id, variant, note) VALUES (@chunk_id, @variant, @note)
  `),
};

/*
? Update a single field on a chunk if it's empty
*/
function updateChunkFieldIfEmpty(db, chunkId, fieldName, jsonValue) {
  if (!jsonValue) return false;
  const sql = `UPDATE chunks SET ${fieldName} = ? WHERE id = ? AND (${fieldName} IS NULL OR ${fieldName} = '')`;
  const stmt = db.prepare(sql);
  const result = stmt.run(jsonValue, chunkId);
  return result.changes > 0;
}

/*
? Placeholder detection for examples
*/
function isPlaceholderExample(text) {
  if (!text) return true;
  const t = text.trim();
  return (
    t.startsWith('Phrase exemple') ||
    t.startsWith('Exemple final') ||
    /^(à tout à|comment allez|je ne sais|il y a|je vais|je suis|tu es|on est)[\s+]*(l'heure|-vous|pas|a|bien|suis|es|est)/.test(
      t,
    )
  );
}

/*
? Split comma-separated string, trim each, deduplicate
*/
function splitAndTrim(str) {
  if (!str) return [];
  return [
    ...new Set(
      str
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  ];
}

/*
? Load all chunk JSON files
*/
function loadChunkFiles() {
  const files = fs
    .readdirSync(FR_CHUNKS_DIR)
    .filter((f) => f.startsWith('french_chunks_batch') && f.endsWith('.json'));
  const allEntries = [];

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(FR_CHUNKS_DIR, file), 'utf-8'));
      if (Array.isArray(data)) {
        allEntries.push(...data);
      }
    } catch (e) {
      console.log(`  Warning: Could not parse ${file}: ${e.message}`);
    }
  }

  return allEntries;
}

/*
? Load all grammar JSON files
*/
function loadGrammarFiles() {
  const files = fs
    .readdirSync(FR_GRAMMAR_DIR)
    .filter((f) => f.startsWith('french_grammar_batch') && f.endsWith('.json'));
  const allEntries = [];

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(FR_GRAMMAR_DIR, file), 'utf-8'));
      if (Array.isArray(data)) {
        allEntries.push(...data);
      }
    } catch (e) {
      console.log(`  Warning: Could not parse ${file}: ${e.message}`);
    }
  }

  return allEntries;
}

/*
? Main processing
*/
function runCompletion() {
  const report = {
    chunks_updated: 0,
    examples_inserted: 0,
    collocations_inserted: 0,
    variations_inserted: 0,
    grammar_updated: 0,
    errors: [],
  };

  // Create reports directory
  const reportsDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const now = new Date().toISOString();

  /*
  ! PHASE 2-5: Process chunk JSON files
  */
  console.log('[Phase 2-5] Processing chunk files...');
  const chunkEntries = loadChunkFiles();
  console.log(`  Loaded ${chunkEntries.length} chunk entries from JSON`);

  // Create lookup map (deduplicate by chunk_text)
  const chunkMap = new Map();
  for (const entry of chunkEntries) {
    chunkMap.set(entry.chunk_text, entry);
  }

  // Process each entry
  let processed = 0;
  for (const [chunkText, entry] of chunkMap) {
    try {
      const dbChunk = stmts.getChunkByText.get(chunkText);
      if (!dbChunk) continue;

      processed++;

      // Phase 2: Update NULL fields (individual field updates to avoid parameter limit)
      let anyUpdated = false;
      anyUpdated =
        updateChunkFieldIfEmpty(db, dbChunk.id, 'variations', entry.variations) || anyUpdated;
      anyUpdated =
        updateChunkFieldIfEmpty(db, dbChunk.id, 'common_mistakes', entry.common_mistakes) ||
        anyUpdated;
      anyUpdated =
        updateChunkFieldIfEmpty(
          db,
          dbChunk.id,
          'typical_collocates',
          entry.collocates || entry.typical_collocates,
        ) || anyUpdated;
      anyUpdated =
        updateChunkFieldIfEmpty(db, dbChunk.id, 'trigger_situations', entry.trigger_situations) ||
        anyUpdated;
      anyUpdated =
        updateChunkFieldIfEmpty(db, dbChunk.id, 'contexts', entry.contexts) || anyUpdated;
      anyUpdated =
        updateChunkFieldIfEmpty(
          db,
          dbChunk.id,
          'communicative_purpose',
          entry.communicative_purpose,
        ) || anyUpdated;
      if (anyUpdated) report.chunks_updated++;

      // Phase 3: Insert examples (skip placeholders)
      stmts.deleteExamplesByChunk.run(dbChunk.id);

      const exampleFields = ['example_1', 'example_2', 'example_3'];
      const transFields = [
        'example_1_translation',
        'example_2_translation',
        'example_3_translation',
      ];
      let exampleCount = 0;

      for (let i = 0; i < 3; i++) {
        const ex = entry[exampleFields[i]];
        const trans = entry[transFields[i]];
        if (ex && !isPlaceholderExample(ex)) {
          stmts.insertExample.run({
            item_id: dbChunk.id,
            example_index: i,
            text_en: trans || '',
            text_target: ex,
            created_at: now,
          });
          exampleCount++;
        }
      }
      report.examples_inserted += exampleCount;

      // Phase 4: Insert collocations (deduplicate before insert)
      stmts.deleteCollocationsByChunk.run(dbChunk.id);
      const collocates = splitAndTrim(entry.collocates || entry.typical_collocates || '');
      for (const word of collocates) {
        stmts.insertCollocation.run({ chunk_id: dbChunk.id, word, strength: 'medium' });
      }
      report.collocations_inserted += collocates.length;

      // Phase 5: Insert variations (deduplicate before insert)
      stmts.deleteVariationsByChunk.run(dbChunk.id);
      const variations_list = splitAndTrim(entry.variations || '');
      for (const variant of variations_list) {
        stmts.insertVariation.run({ chunk_id: dbChunk.id, variant, note: null });
      }
      report.variations_inserted += variations_list.length;
    } catch (e) {
      report.errors.push({ chunk: chunkText, error: e.message });
    }
  }

  console.log(`  Processed ${processed} chunks, updated ${report.chunks_updated} records`);

  /*
  ! PHASE 6: Process grammar files
  */
  console.log('\n[Phase 6] Processing grammar files...');
  const grammarEntries = loadGrammarFiles();
  console.log(`  Loaded ${grammarEntries.length} grammar entries from JSON`);

  let grammarProcessed = 0;
  for (const entry of grammarEntries) {
    try {
      if (!entry.structure_label) continue;

      const dbGrammar = stmts.getGrammarByLabel.get(entry.structure_label);
      if (!dbGrammar) continue;

      grammarProcessed++;

      const essentialVocab = entry.essential_vocabulary_slots || entry.essential_vocabulary || '';
      if (essentialVocab) {
        stmts.updateGrammarSlots.run(essentialVocab, dbGrammar.id);
        if (stmts.getChanges.get().count > 0) {
          report.grammar_updated++;
        }
      }
    } catch (e) {
      report.errors.push({ grammar: entry.structure_label, error: e.message });
    }
  }

  console.log(
    `  Processed ${grammarProcessed} grammar entries, updated ${report.grammar_updated} records`,
  );

  /*
  ! Write report
  */
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log('\n=== SUMMARY ===');
  console.log(`Chunks updated: ${report.chunks_updated}`);
  console.log(`Examples inserted: ${report.examples_inserted}`);
  console.log(`Collocations inserted: ${report.collocations_inserted}`);
  console.log(`Variations inserted: ${report.variations_inserted}`);
  console.log(`Grammar updated: ${report.grammar_updated}`);
  if (report.errors.length > 0) {
    console.log(`Errors: ${report.errors.length}`);
    report.errors.slice(0, 20).forEach((e) => console.log(`  - ${JSON.stringify(e)}`));
    if (report.errors.length > 20) {
      console.log(`  ... and ${report.errors.length - 20} more errors`);
    }
  }
  console.log(`\nReport written to: ${REPORT_PATH}`);

  db.close();
  return report;
}

runCompletion();
