/*
! French content import Phase 3/4: Dry-run + Import script
? Uses prepared statements only, transaction per file, reports to JSON
! FIXED: Uses ACTUAL schema columns from chunks_v1.db
! Schema: examples(item_type,item_id,example_index,text_en,text_target)
!         collocations(chunk_id,word,strength)
!         variations(chunk_id,variant,note)
*/

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'chunks_v1.db');
const FR_DIR = path.join(__dirname, 'fr');
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const PROGRESS_PATH = path.join(REPORT_DIR, 'fr-import-progress.json');
const ERRORS_PATH = path.join(REPORT_DIR, 'fr-import-errors.json');

const DRY_RUN = process.argv.includes('--dry-run');
const NOW = new Date().toISOString();

console.log(`\n=== FRENCH IMPORT ${DRY_RUN ? '(DRY-RUN MODE)' : '(LIVE)'} ===\n`);

if (DRY_RUN) {
  console.log('⚠ DRY-RUN: No changes will be committed to the database\n');
}

/*
? Open DB with WAL mode for better concurrency
*/
const db = new Database(DB_PATH, { verbose: null });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/*
? Prepared statements using ACTUAL schema columns
*/
const stmts = {
  // Lookup category by name
  getCategoryByName: db.prepare(`SELECT id FROM categories WHERE name = ? LIMIT 1`),

  // Lookup cefr level by code
  getCefrLevel: db.prepare(`SELECT id FROM cefr_levels WHERE code = ? LIMIT 1`),

  // Check if chunk already exists (idempotency)
  chunkExists: db.prepare(`SELECT id FROM chunks WHERE chunk_text = ? AND language = 'fr' LIMIT 1`),

  // Insert chunk - using ACTUAL columns from schema
  // chunks: id,category_id,source_file,entry_index,entry_total,chunk_text,meaning,
  //        primary_function,communicative_purpose,trigger_situations,contexts,
  //        register_id,cefr_level_id,output_priority,frequency,formulaicity,
  //        construction_type,acquisition_priority,pattern,core_structure,
  //        substitution_slots,typical_collocates,common_substitutions,variations,
  //        common_mistakes,similar_contrasting,interference_warnings,nuance,
  //        pragmatic_effect,note,recall_cue,spacing_tag,upgrade_path,chunk_family,
  //        slug,content_hash,display_order,is_idiom,created_at,updated_at,language
  insertChunk: db.prepare(`
    INSERT INTO chunks (
      chunk_text, meaning, primary_function, communicative_purpose,
      trigger_situations, contexts, note, pattern,
      cefr_level_id, category_id, source_file, entry_index, entry_total,
      display_order, is_idiom, created_at, updated_at, language, content_hash
    ) VALUES (
      @chunk_text, @meaning, @primary_function, @communicative_purpose,
      @trigger_situations, @contexts, @note, @pattern,
      @cefr_level_id, @category_id, @source_file, @entry_index, @entry_total,
      @display_order, @is_idiom, @created_at, @updated_at, @language, @content_hash
    )
  `),

  // Insert example - ACTUAL columns: item_type, item_id, example_index, text_en, text_target, audio_path, is_canonical, created_at
  // For French: text_target=French, text_en=English translation
  insertExample: db.prepare(`
    INSERT INTO examples (item_type, item_id, example_index, text_en, text_target, created_at)
    VALUES ('chunk', @item_id, @example_index, @text_en, @text_target, @created_at)
  `),

  // Insert collocation - ACTUAL columns: chunk_id, word, strength (NO created_at)
  insertCollocation: db.prepare(`
    INSERT INTO collocations (chunk_id, word, strength)
    VALUES (@chunk_id, @word, @strength)
  `),

  // Insert variation - ACTUAL columns: chunk_id, variant, note (NO created_at)
  insertVariation: db.prepare(`
    INSERT INTO variations (chunk_id, variant, note)
    VALUES (@chunk_id, @variant, @note)
  `),

  // Grammar prepared statements - using ACTUAL columns
  // grammar_structures: id,category_id,source_file,entry_index,entry_total,
  //   structure_label,core_meaning,primary_communicative_fn,when_to_use,pattern,
  //   key_variations,essential_vocabulary_slots,common_learner_mistakes,
  //   chunk_compatibility,primary_function,key_forms,essential_vocabulary,
  //   why_it_matters,common_mistakes,slug,content_hash,display_order,
  //   created_at,updated_at,language
  grammarExists: db.prepare(
    `SELECT id FROM grammar_structures WHERE structure_label = ? AND language = 'fr' LIMIT 1`,
  ),

  insertGrammar: db.prepare(`
    INSERT INTO grammar_structures (
      structure_label, core_meaning, primary_communicative_fn,
      when_to_use, pattern, key_forms, primary_function,
      source_file, entry_index, entry_total,
      display_order, created_at, updated_at, language, content_hash
    ) VALUES (
      @structure_label, @core_meaning, @primary_communicative_fn,
      @when_to_use, @pattern, @key_forms, @primary_function,
      @source_file, @entry_index, @entry_total,
      @display_order, @created_at, @updated_at, @language, @content_hash
    )
  `),

  // Vocab prepared statements
  vocabExists: db.prepare(
    `SELECT id FROM vocabulary_words WHERE word = ? AND language = 'fr' LIMIT 1`,
  ),

  insertVocab: db.prepare(`
    INSERT INTO vocabulary_words (
      word, category, part_of_speech, cefr_level,
      primary_meaning, secondary_meaning, usage_notes,
      common_collocations, synonyms, antonyms,
      example_1, example_1_translation, example_2, example_2_translation,
      example_3, example_3_translation, related_words, common_mistakes,
      learning_priority, created_at, language
    ) VALUES (
      @word, @category, @part_of_speech, @cefr_level,
      @primary_meaning, @secondary_meaning, @usage_notes,
      @common_collocations, @synonyms, @antonyms,
      @example_1, @example_1_translation, @example_2, @example_2_translation,
      @example_3, @example_3_translation, @related_words, @common_mistakes,
      @learning_priority, @created_at, @language
    )
  `),
};

/*
? Utility: Compute content hash for deduplication
! Uses only fields that exist in actual schema
*/
function computeHash(entry, type) {
  const fields =
    type === 'chunk'
      ? ['chunk_text', 'meaning', 'primary_function']
      : type === 'grammar'
        ? ['structure_label', 'core_meaning']
        : ['word', 'primary_meaning', 'cefr_level'];

  const data = {};
  for (const f of fields) {
    if (entry[f] !== undefined) data[f] = entry[f];
  }
  return JSON.stringify(data);
}

/*
? Detect file type from filename
*/
function detectFileType(filename) {
  if (filename.includes('vocab')) return 'vocab';
  if (filename.includes('grammar')) return 'grammar';
  if (filename.includes('chunks')) return 'chunk';
  return null;
}

/*
? Ensure 'fr_general' category exists
*/
function ensureFrGeneralCategory() {
  let cat = stmts.getCategoryByName.get('fr_general');
  if (!cat) {
    if (!DRY_RUN) {
      db.prepare(
        `INSERT INTO categories (corpus_id, code, name, type, description, source_file, created_at) VALUES (1, 'fr_general', 'fr_general', 'foundation', 'French general content', 'fr-import.js', ?)`,
      ).run(NOW);
    }
    cat = stmts.getCategoryByName.get('fr_general');
  }
  return cat ? cat.id : null;
}

/*
? Import a single chunk entry
*/
function importChunk(entry, fileInfo) {
  const { filename, entryIndex, totalEntries } = fileInfo;

  // Idempotency check
  const existing = stmts.chunkExists.get(entry.chunk_text);
  if (existing) return { action: 'skipped', reason: 'exists' };

  // Lookup category
  const categoryName = entry.category || 'fr_general';
  let category = stmts.getCategoryByName.get(categoryName);
  const categoryId = category ? category.id : ensureFrGeneralCategory();

  // Lookup cefr level
  let cefrLevelId = null;
  if (entry.level) {
    const lvl = stmts.getCefrLevel.get(entry.level);
    if (lvl) cefrLevelId = lvl.id;
  }

  const hash = computeHash(entry, 'chunk');
  const now = NOW;

  const chunkData = {
    chunk_text: entry.chunk_text,
    meaning: entry.meaning || '',
    primary_function: entry.primary_function || '',
    communicative_purpose: entry.communicative_purpose || '',
    trigger_situations: entry.trigger_situations || '',
    contexts: entry.contexts || '',
    note: entry.note || entry.usage_notes || '',
    pattern: entry.pattern || '',
    cefr_level_id: cefrLevelId,
    category_id: categoryId,
    source_file: filename,
    entry_index: entryIndex,
    entry_total: totalEntries,
    display_order: entryIndex,
    is_idiom: entry.is_idiom ? 1 : 0,
    created_at: now,
    updated_at: now,
    language: 'fr',
    content_hash: hash,
  };

  if (DRY_RUN) {
    return { action: 'would_insert', type: 'chunk', key: entry.chunk_text };
  }

  const result = stmts.insertChunk.run(chunkData);
  const chunkId = result.lastInsertRowid;

  // Insert examples (example_1, example_2, example_3 → text_target, with text_en as translation)
  const exampleFields = ['example_1', 'example_2', 'example_3'];
  const transFields = ['example_1_translation', 'example_2_translation', 'example_3_translation'];

  for (let i = 0; i < exampleFields.length; i++) {
    const ex = entry[exampleFields[i]];
    const trans = entry[transFields[i]];
    if (ex) {
      stmts.insertExample.run({
        item_id: chunkId,
        example_index: i,
        text_en: trans || '', // English translation
        text_target: ex, // French example
        created_at: now,
      });
    }
  }

  // Insert collocations (collocations array of {text, translation} or just strings)
  if (Array.isArray(entry.collocations)) {
    entry.collocations.forEach((col, idx) => {
      const word = typeof col === 'string' ? col : col.text || col.word || '';
      const strength = typeof col === 'object' ? col.strength || col.translation || '' : '';
      stmts.insertCollocation.run({
        chunk_id: chunkId,
        word: word,
        strength: strength,
      });
    });
  }

  // Insert variations (variations array of {text, translation} or just strings)
  if (Array.isArray(entry.variations)) {
    entry.variations.forEach((vari, idx) => {
      const variant = typeof vari === 'string' ? vari : vari.text || vari.variant || '';
      const note = typeof vari === 'object' ? vari.translation || vari.note || '' : '';
      stmts.insertVariation.run({
        chunk_id: chunkId,
        variant: variant,
        note: note,
      });
    });
  }

  return { action: 'inserted', type: 'chunk', key: entry.chunk_text, id: chunkId };
}

/*
? Import a single grammar entry
*/
function importGrammar(entry, fileInfo) {
  const { filename, entryIndex, totalEntries } = fileInfo;

  // Idempotency check
  const existing = stmts.grammarExists.get(entry.structure_label);
  if (existing) return { action: 'skipped', reason: 'exists' };

  const hash = computeHash(entry, 'grammar');
  const now = NOW;

  // Prefix key_forms with level: "[A1] je suis / tu es / ..."
  let keyForms = entry.key_forms || '';
  if (entry.level && keyForms && !keyForms.startsWith('[')) {
    keyForms = `[${entry.level}] ${keyForms}`;
  }

  const grammarData = {
    structure_label: entry.structure_label,
    core_meaning: entry.core_meaning || '',
    primary_communicative_fn: entry.primary_communicative_fn || '',
    when_to_use: entry.when_to_use || '',
    pattern: entry.pattern || '',
    key_forms: keyForms,
    primary_function: entry.primary_function || '',
    source_file: filename,
    entry_index: entryIndex,
    entry_total: totalEntries,
    display_order: entryIndex,
    created_at: now,
    updated_at: now,
    language: 'fr',
    content_hash: hash,
  };

  if (DRY_RUN) {
    return { action: 'would_insert', type: 'grammar', key: entry.structure_label };
  }

  const result = stmts.insertGrammar.run(grammarData);
  return {
    action: 'inserted',
    type: 'grammar',
    key: entry.structure_label,
    id: result.lastInsertRowid,
  };
}

/*
? Import a single vocab entry
*/
function importVocab(entry, fileInfo) {
  const { filename, entryIndex, totalEntries } = fileInfo;

  // Idempotency check
  const existing = stmts.vocabExists.get(entry.word);
  if (existing) return { action: 'skipped', reason: 'exists' };

  const hash = computeHash(entry, 'vocab');
  const now = NOW;

  const vocabData = {
    word: entry.word,
    category: entry.category || '',
    part_of_speech: entry.part_of_speech || '',
    cefr_level: entry.cefr_level || entry.level || '',
    primary_meaning: entry.primary_meaning || '',
    secondary_meaning: entry.secondary_meaning || '',
    usage_notes: entry.usage_notes || '',
    common_collocations: Array.isArray(entry.collocations)
      ? entry.collocations
          .map((c) => (typeof c === 'string' ? c : c.text || c.word || ''))
          .join(', ')
      : entry.common_collocations || '',
    synonyms: Array.isArray(entry.synonyms) ? entry.synonyms.join(', ') : entry.synonyms || '',
    antonyms: Array.isArray(entry.antonyms) ? entry.antonyms.join(', ') : entry.antonyms || '',
    example_1: entry.example_1 || '',
    example_1_translation: entry.example_1_translation || '',
    example_2: entry.example_2 || '',
    example_2_translation: entry.example_2_translation || '',
    example_3: entry.example_3 || '',
    example_3_translation: entry.example_3_translation || '',
    related_words: Array.isArray(entry.related_words)
      ? entry.related_words.join(', ')
      : entry.related_words || '',
    common_mistakes: entry.common_mistakes || '',
    learning_priority: entry.learning_priority || '',
    created_at: now,
    language: 'fr',
  };

  if (DRY_RUN) {
    return { action: 'would_insert', type: 'vocab', key: entry.word };
  }

  const result = stmts.insertVocab.run(vocabData);
  return { action: 'inserted', type: 'vocab', key: entry.word, id: result.lastInsertRowid };
}

/*
? Process a single file
*/
function processFile(filepath) {
  const filename = path.basename(filepath);
  const type = detectFileType(filename);

  if (!type) {
    return { file: filename, error: 'unknown_file_type' };
  }

  let rawData;
  try {
    rawData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (e) {
    return { file: filename, error: e.message };
  }

  if (!Array.isArray(rawData)) {
    return { file: filename, error: 'not_an_array' };
  }

  const report = {
    file: filename,
    type,
    total_entries: rawData.length,
    inserted: 0,
    would_insert: 0,
    skipped: 0,
    errors: 0,
  };

  const errors = [];

  if (DRY_RUN) {
    // Dry-run: just count what WOULD happen
    for (let i = 0; i < rawData.length; i++) {
      const entry = rawData[i];

      if (type === 'chunk') {
        const existing = stmts.chunkExists.get(entry.chunk_text);
        if (existing) {
          report.skipped++;
        } else {
          report.would_insert++;
        }
      } else if (type === 'grammar') {
        const existing = stmts.grammarExists.get(entry.structure_label);
        if (existing) {
          report.skipped++;
        } else {
          report.would_insert++;
        }
      } else {
        const existing = stmts.vocabExists.get(entry.word);
        if (existing) {
          report.skipped++;
        } else {
          report.would_insert++;
        }
      }
    }
  } else {
    // Live mode: use transactions
    // CRITICAL: Ensure fr_general category exists BEFORE transaction starts
    // This prevents rollback of category insert if chunk insert fails later
    if (type === 'chunk') {
      ensureFrGeneralCategory();
    } else if (type === 'grammar') {
      ensureFrGeneralCategory(); // grammar also uses category_id
    }

    const transaction = db.transaction(() => {
      for (let i = 0; i < rawData.length; i++) {
        const entry = rawData[i];
        try {
          let result;
          const fileInfo = { filename, entryIndex: i, totalEntries: rawData.length };

          if (type === 'chunk') {
            result = importChunk(entry, fileInfo);
          } else if (type === 'grammar') {
            result = importGrammar(entry, fileInfo);
          } else {
            result = importVocab(entry, fileInfo);
          }

          if (result.action === 'inserted') {
            report.inserted++;
          } else if (result.action === 'skipped') {
            report.skipped++;
          }
        } catch (e) {
          report.errors++;
          errors.push({
            file: filename,
            entry_index: i,
            entry_key: entry.chunk_text || entry.structure_label || entry.word,
            error: e.message,
          });
          throw e; // Rollback transaction
        }
      }
    });

    try {
      transaction();
    } catch (e) {
      report.errors = rawData.length; // All failed on error
    }
  }

  return { report, errors };
}

/*
? Main execution
*/
function runImport() {
  // Ensure reports directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // Get all French JSON files from audit report (only NEW ones)
  const auditReport = JSON.parse(
    fs.readFileSync(path.join(REPORT_DIR, 'fr-import-audit.json'), 'utf-8'),
  );

  const filesToProcess = [];
  for (const fileReport of auditReport.files) {
    if (fileReport.new.length > 0) {
      const filepath = path.join(FR_DIR, fileReport.file);
      if (fs.existsSync(filepath)) {
        filesToProcess.push({
          file: fileReport.file,
          type: fileReport.type,
          newCount: fileReport.new.length,
          totalEntries: fileReport.total_entries,
          path: filepath,
        });
      }
    }
  }

  console.log(`Found ${filesToProcess.length} files with NEW entries\n`);

  const allReports = [];
  const allErrors = [];
  const summary = {
    mode: DRY_RUN ? 'dry-run' : 'live',
    timestamp: NOW,
    files_processed: 0,
    total_entries: 0,
    inserted: 0,
    would_insert: 0,
    skipped: 0,
    errors: 0,
    error_types: {},
  };

  for (const fileInfo of filesToProcess) {
    console.log(
      `Processing: ${fileInfo.file} (${fileInfo.newCount} new of ${fileInfo.totalEntries} total)`,
    );

    const result = processFile(fileInfo.path);

    if (result.report) {
      allReports.push(result.report);
      summary.files_processed++;
      summary.total_entries += result.report.total_entries;
      summary.inserted += result.report.inserted;
      summary.would_insert += result.report.would_insert;
      summary.skipped += result.report.skipped;
      summary.errors += result.report.errors;

      if (DRY_RUN) {
        console.log(
          `  → Would insert: ${result.report.would_insert}, Skipped (exist): ${result.report.skipped}`,
        );
      } else {
        console.log(
          `  → Inserted: ${result.report.inserted}, Skipped: ${result.report.skipped}, Errors: ${result.report.errors}`,
        );
      }
    }

    if (result.errors && result.errors.length > 0) {
      allErrors.push(...result.errors);
    }
  }

  // Write progress report
  const progressReport = {
    ...summary,
    files: allReports,
  };
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progressReport, null, 2));

  // Write errors report
  if (allErrors.length > 0) {
    fs.writeFileSync(ERRORS_PATH, JSON.stringify({ errors: allErrors }, null, 2));
  } else if (fs.existsSync(ERRORS_PATH)) {
    fs.unlinkSync(ERRORS_PATH);
  }

  // Print summary
  console.log(`\n=== SUMMARY (${DRY_RUN ? 'DRY-RUN' : 'LIVE'}) ===`);
  console.log(`Files processed: ${summary.files_processed}`);
  console.log(`Total entries: ${summary.total_entries}`);
  if (DRY_RUN) {
    console.log(`Would insert: ${summary.would_insert}`);
  } else {
    console.log(`Inserted: ${summary.inserted}`);
  }
  console.log(`Skipped (exist): ${summary.skipped}`);
  console.log(`Errors: ${summary.errors}`);
  console.log(`\nProgress written to: ${PROGRESS_PATH}`);
  if (allErrors.length > 0) {
    console.log(`Errors written to: ${ERRORS_PATH}`);
  }

  db.close();

  return summary;
}

runImport();
