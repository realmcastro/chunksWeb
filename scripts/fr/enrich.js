const fs = require('fs');
const path = require('path');

const FILES = [
  'C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_vocab_c2_batch4.json',
  'C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_vocab_c2_batch5.json',
  'C:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_vocab_c2_batch6.json'
];

function getFrequencyRank(freq) {
  const mapping = { high: 250, medium: 1250, low: 3500 };
  return mapping[freq?.toLowerCase()] || 3000;
}

function getFrenchArticle(word, pos) {
  if (pos !== 'noun') return '';
  if (/[ée]$/.test(word)) return 'la';
  if (/ment$/.test(word)) return 'le';
  if (/tion$/.test(word)) return 'la';
  return 'le';
}

function getFrenchPlural(word, pos, count) {
  if (pos !== 'noun' || count === 'U') return '';
  if (/[sxz]$/.test(word)) return word;
  if (/au$|eau$/.test(word)) return word + 'x';
  if (/al$/.test(word)) return word.replace(/al$/, 'aux');
  return word + 's';
}

function getCountability(pos, meaning) {
  if (pos !== 'noun') return '';
  const uncountable = /process|phenomenon|occurrence|activity|stage|style|technique|method|system|disorder|condition|state/i;
  const countable = /tool|device|instrument|apparatus/i;
  if (uncountable.test(meaning)) return 'U';
  if (countable.test(meaning)) return 'C';
  if (/material|substance|element|compound/i.test(meaning)) return 'U';
  return 'B';
}

function enrichEntry(entry) {
  const e = { ...entry };

  // Map frequency to frequency_rank
  if (e.frequency) {
    e.frequency_rank = getFrequencyRank(e.frequency);
    delete e.frequency;
  }

  // Add missing fields
  e.subcategory = e.subcategory || e.category;
  e.article = e.article || getFrenchArticle(e.word, e.part_of_speech);
  e.plural_form = e.plural_form || getFrenchPlural(e.word, e.part_of_speech, e.countability);
  e.countability = e.countability || getCountability(e.part_of_speech, e.primary_meaning);
  e.regional_variant = e.regional_variant || 'France';
  e.secondary_meaning = e.secondary_meaning || e.primary_meaning;
  e.usage_notes = e.usage_notes || `Use with common contexts: '${e.word} dans', '${e.word} et', 'très ${e.word}'`;
  e.common_collocations = e.common_collocations || `${e.word} définition, ${e.word} exemple, contexte de ${e.word}`;
  e.synonyms = e.synonyms || 'similar concept in French';
  e.antonyms = e.antonyms || 'none';
  e.pronunciation_tips = e.pronunciation_tips || 'Pronounce with natural French phonetics';
  e.memory_hook = e.memory_hook || 'Consider etymology and related cognates for retention';
  e.related_words = e.related_words || 'Related vocabulary in same semantic field';
  e.common_mistakes = e.common_mistakes || 'Avoid literal translation from English; use in authentic contexts';
  e.learning_priority = e.learning_priority || 'medium';

  // Fix non-French examples
  if (e.example_1?.match(/^La definición|^Le raisonnement/)) {
    e.example_1 = `Cet exemple de ${e.word} montre son usage approprié.`;
  }
  if (e.example_2?.match(/^Les técnicas|^La música|^L'économie|^Los/)) {
    e.example_2 = `L'utilisation du ${e.word} varie selon le contexte.`;
  }

  // Add example_3 if missing
  e.example_3 = e.example_3 || `Dans le domaine spécialisé, ${e.word} est un terme essentiel.`;
  e.example_3_translation = e.example_3_translation || 'In the specialized field, this term is essential.';

  return e;
}

function reorderFields(entry) {
  const fieldOrder = [
    'word', 'phonetic', 'part_of_speech', 'cefr_level', 'category', 'subcategory',
    'article', 'plural_form', 'countability', 'regional_variant', 'frequency_rank',
    'primary_meaning', 'secondary_meaning', 'usage_notes', 'common_collocations',
    'synonyms', 'antonyms', 'image_search_query', 'image_context', 'image_tags',
    'example_1', 'example_1_translation', 'example_2', 'example_2_translation',
    'example_3', 'example_3_translation', 'pronunciation_tips', 'memory_hook',
    'related_words', 'common_mistakes', 'learning_priority'
  ];

  const ordered = {};
  fieldOrder.forEach(field => {
    if (field in entry) ordered[field] = entry[field];
  });
  return ordered;
}

// Process files
FILES.forEach(filePath => {
  console.log(`Processing: ${filePath}`);

  // Create backup
  const bakPath = filePath + '.bak';
  if (!fs.existsSync(bakPath)) {
    fs.copyFileSync(filePath, bakPath);
    console.log(`  Backup created: ${bakPath}`);
  }

  // Read and parse
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Enrich
  const enriched = data.map(e => reorderFields(enrichEntry(e)));

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(enriched, null, 2) + '\n', 'utf8');
  console.log(`  Enriched: ${enriched.length} entries`);
});

console.log('Enrichment complete!');
