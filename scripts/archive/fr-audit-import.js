/*
! French content import Phase 1: File-by-file audit against chunks_v1.db
? Determines NEW | EXISTS_OK | EXISTS_DIVERGENT | PLACEHOLDER status for each entry
*/

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'chunks_v1.db');
const FR_DIR = path.join(__dirname, 'fr');
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'fr-import-audit.json');

const PLACEHOLDER_TEXT_TARGET_REGEX =
  /^(Phrase exemple|Exemple final pour|La phrase montre|Un autre exemple)/i;
const PLACEHOLDER_TEXT_EN_REGEX = /^Example sentence/i;

const db = new Database(DB_PATH, { readonly: true });

/*
? Prepared statements for each table type
*/
const stmts = {
  chunkByKey: db.prepare(`
    SELECT id, content_hash, chunk_text, meaning, language
    FROM chunks
    WHERE chunk_text = ? AND language = 'fr'
    LIMIT 1
  `),
  grammarByKey: db.prepare(`
    SELECT id, content_hash, structure_label, language
    FROM grammar_structures
    WHERE structure_label = ? AND language = 'fr'
    LIMIT 1
  `),
  vocabByKey: db.prepare(`
    SELECT id, word, language
    FROM vocabulary_words
    WHERE word = ? AND language = 'fr'
    LIMIT 1
  `),
};

/*
? File type detection from filename
*/
function detectFileType(filename) {
  if (filename.includes('vocab')) return 'vocab';
  if (filename.includes('grammar')) return 'grammar';
  if (filename.includes('chunks')) return 'chunk';
  return null;
}

/*
? Compute a simple hash for content comparison (for divergent detection)
? Uses JSON stringify of key fields only
*/
function computeContentHash(entry, type) {
  const keyFields =
    type === 'chunk'
      ? ['chunk_text', 'meaning', 'primary_function', 'level']
      : type === 'grammar'
        ? ['structure_label', 'core_meaning', 'level']
        : ['word', 'primary_meaning', 'cefr_level'];

  const data = {};
  for (const f of keyFields) {
    if (entry[f] !== undefined) data[f] = entry[f];
  }
  return JSON.stringify(data);
}

/*
? Detect placeholder examples in chunks
*/
function detectPlaceholderExamples(entry, chunkText) {
  const placeholders = [];
  const exampleFields = ['example_1', 'example_2', 'example_3'];
  const translationFields = [
    'example_1_translation',
    'example_2_translation',
    'example_3_translation',
  ];

  for (let i = 0; i < exampleFields.length; i++) {
    const exField = exampleFields[i];
    const transField = translationFields[i];
    const example = entry[exField];
    const translation = entry[transField];

    if (!example) continue;

    let reason = null;

    if (
      PLACEHOLDER_TEXT_TARGET_REGEX.test(example) ||
      PLACEHOLDER_TEXT_EN_REGEX.test(translation || '')
    ) {
      reason = `placeholder_text`;
    } else if (example === chunkText || example === entry.pattern?.[0]) {
      reason = `pattern_repetition`;
    } else if (
      example.includes(`${chunkText} est une expression utile`) ||
      example.includes(`"${chunkText}" est une expression`)
    ) {
      reason = `generic_description`;
    }

    if (reason) {
      placeholders.push({
        example_index: i,
        example_text: example.substring(0, 100),
        reason,
      });
    }
  }

  return placeholders;
}

/*
? Compare two entries for field-level differences (for divergent reporting)
*/
function getDiffFields(entryA, entryB, type) {
  const fields =
    type === 'chunk'
      ? [
          'chunk_text',
          'meaning',
          'primary_function',
          'communicative_purpose',
          'trigger_situations',
          'contexts',
          'level',
        ]
      : type === 'grammar'
        ? [
            'structure_label',
            'core_meaning',
            'primary_communicative_fn',
            'when_to_use',
            'pattern',
            'level',
          ]
        : ['word', 'primary_meaning', 'part_of_speech', 'cefr_level', 'category'];

  const diffs = [];
  for (const f of fields) {
    if (entryA[f] !== entryB[f]) {
      diffs.push(f);
    }
  }
  return diffs;
}

/*
? Audit a single chunk entry against DB
*/
function auditChunkEntry(entry, entryIndex) {
  const naturalKey = entry.chunk_text;
  const contentHash = computeContentHash(entry, 'chunk');

  const existing = stmts.chunkByKey.get(naturalKey);

  if (!existing) {
    return {
      status: 'NEW',
      entry_index: entryIndex,
      natural_key: naturalKey,
      placeholders: detectPlaceholderExamples(entry, naturalKey),
    };
  }

  if (existing.content_hash === contentHash) {
    return {
      status: 'EXISTS_OK',
      entry_index: entryIndex,
      natural_key: naturalKey,
      db_id: existing.id,
    };
  }

  return {
    status: 'EXISTS_DIVERGENT',
    entry_index: entryIndex,
    natural_key: naturalKey,
    db_id: existing.id,
    diff_fields: getDiffFields(entry, existing, 'chunk'),
  };
}

/*
? Audit a single grammar entry against DB
*/
function auditGrammarEntry(entry, entryIndex) {
  const naturalKey = entry.structure_label;
  const contentHash = computeContentHash(entry, 'grammar');

  const existing = stmts.grammarByKey.get(naturalKey);

  if (!existing) {
    return {
      status: 'NEW',
      entry_index: entryIndex,
      natural_key: naturalKey,
    };
  }

  if (existing.content_hash === contentHash) {
    return {
      status: 'EXISTS_OK',
      entry_index: entryIndex,
      natural_key: naturalKey,
      db_id: existing.id,
    };
  }

  return {
    status: 'EXISTS_DIVERGENT',
    entry_index: entryIndex,
    natural_key: naturalKey,
    db_id: existing.id,
    diff_fields: getDiffFields(entry, existing, 'grammar'),
  };
}

/*
? Audit a single vocab entry against DB
*/
function auditVocabEntry(entry, entryIndex) {
  const naturalKey = entry.word;

  const existing = stmts.vocabByKey.get(naturalKey);

  if (!existing) {
    return {
      status: 'NEW',
      entry_index: entryIndex,
      natural_key: naturalKey,
    };
  }

  return {
    status: 'EXISTS_OK',
    entry_index: entryIndex,
    natural_key: naturalKey,
    db_id: existing.id,
  };
}

/*
? Audit a single file and return structured report
*/
function auditFile(filepath) {
  const filename = path.basename(filepath);
  const type = detectFileType(filename);

  if (!type) {
    console.error(`Unknown file type: ${filename}`);
    return null;
  }

  let rawData;
  try {
    rawData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (e) {
    console.error(`Failed to parse ${filename}: ${e.message}`);
    return null;
  }

  if (!Array.isArray(rawData)) {
    console.error(`${filename}: Expected array, got ${typeof rawData}`);
    return null;
  }

  const report = {
    file: filename,
    type,
    total_entries: rawData.length,
    new: [],
    exists_ok: [],
    exists_divergent: [],
    placeholder_examples: [],
  };

  const samples = [];

  for (let i = 0; i < rawData.length; i++) {
    const entry = rawData[i];
    let result;

    if (type === 'chunk') {
      result = auditChunkEntry(entry, i);
      if (result.placeholders?.length > 0) {
        for (const p of result.placeholders) {
          report.placeholder_examples.push({
            entry_index: i,
            ...p,
          });
        }
      }
    } else if (type === 'grammar') {
      result = auditGrammarEntry(entry, i);
    } else {
      result = auditVocabEntry(entry, i);
    }

    if (result.status === 'NEW') {
      report.new.push({ entry_index: i, natural_key: result.natural_key });
    } else if (result.status === 'EXISTS_OK') {
      report.exists_ok.push({ entry_index: i, natural_key: result.natural_key });
    } else if (result.status === 'EXISTS_DIVERGENT') {
      report.exists_divergent.push({
        entry_index: i,
        natural_key: result.natural_key,
        diff_fields: result.diff_fields,
      });
    }

    // Collect 3 samples per file (first 3)
    if (samples.length < 3) {
      samples.push({
        entry_index: i,
        natural_key: result.natural_key,
        status: result.status,
        entry_preview: {
          [type === 'chunk' ? 'chunk_text' : type === 'grammar' ? 'structure_label' : 'word']:
            entry[
              type === 'chunk' ? 'chunk_text' : type === 'grammar' ? 'structure_label' : 'word'
            ],
          level: entry.level || entry.cefr_level,
          meaning: entry.meaning || entry.primary_meaning || entry.core_meaning,
        },
      });
    }
  }

  return { report, samples };
}

/*
? Main audit execution
*/
function runAudit() {
  // Ensure reports directory exists
  const reportsDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Get all French JSON files
  const files = fs
    .readdirSync(FR_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  console.log(`Found ${files.length} French JSON files to audit\n`);

  const allReports = [];
  const allSamples = {};
  const summary = {
    total_files: 0,
    total_entries: 0,
    new: 0,
    exists_ok: 0,
    exists_divergent: 0,
    placeholder_examples: 0,
  };

  for (const filename of files) {
    const filepath = path.join(FR_DIR, filename);
    const result = auditFile(filepath);

    if (result) {
      allReports.push(result.report);
      allSamples[filename] = result.samples;

      summary.total_files++;
      summary.total_entries += result.report.total_entries;
      summary.new += result.report.new.length;
      summary.exists_ok += result.report.exists_ok.length;
      summary.exists_divergent += result.report.exists_divergent.length;
      summary.placeholder_examples += result.report.placeholder_examples.length;

      // Progress output
      const status =
        result.report.exists_divergent.length > 0
          ? '⚠ DIVERGENT'
          : result.report.new.length > 0
            ? '✓ NEW ENTRIES'
            : '✓ EXISTS_OK';
      console.log(
        `${status}: ${filename} (${result.report.total_entries} entries, ${result.report.new.length} new, ${result.report.exists_divergent.length} divergent)`,
      );
    }
  }

  // Write full report
  const fullReport = {
    generated_at: new Date().toISOString(),
    summary,
    files: allReports,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(fullReport, null, 2));
  console.log(`\nFull report written to: ${REPORT_PATH}`);

  // Write samples file
  const samplesPath = path.join(reportsDir, 'fr-import-samples.json');
  fs.writeFileSync(samplesPath, JSON.stringify(allSamples, null, 2));
  console.log(`Samples written to: ${samplesPath}`);

  // Print summary
  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Total files: ${summary.total_files}`);
  console.log(`Total entries: ${summary.total_entries}`);
  console.log(`  NEW: ${summary.new}`);
  console.log(`  EXISTS_OK: ${summary.exists_ok}`);
  console.log(`  EXISTS_DIVERGENT: ${summary.exists_divergent}`);
  console.log(`  PLACEHOLDER_EXAMPLES: ${summary.placeholder_examples}`);

  db.close();
}

runAudit();
