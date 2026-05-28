const fs = require('fs');
const path = require('path');

// Read French file
const frFile = 'c:\\Users\\mathe\\OneDrive\\Documentos\\ChunksWeb\\scripts\\fr\\french_vocab_batch_3_b2.json';
const data = JSON.parse(fs.readFileSync(frFile, 'utf-8'));

// Frequency mapping
const frequencyMap = {
  'high': 250,
  'medium': 1250,
  'low': 3500
};

// French article and plural patterns (simplified)
const articles = {
  'la': 'la',
  'le': 'le',
  'l\'': ''
};

const plurals = {
  'la société': 'les sociétés',
  'la politique': 'les politiques',
  'l\'environnement': 'les environnements',
  'la liberté': 'les libertés',
  'la culture': 'les cultures',
  'le développement': 'les développements',
  'l\'opinion': 'les opinions',
  'la connaissance': 'les connaissances',
  'la communication': 'les communications',
  'la responsabilité': 'les responsabilités',
  'la violence': 'les violences',
  'l\'économie': 'les économies',
  'la technologie': 'les technologies',
  'l\'énergie': 'les énergies',
  'la discrimination': 'les discriminations',
  'le gouvernement': 'les gouvernements',
  'l\'immigration': 'les immigrations',
  'la religion': 'les religions',
  'l\'éducation': 'les éducations',
  'la santé': 'les santés',
  'la sécurité': 'les sécurités',
  'l\'indépendance': 'les indépendances',
  'la justice': 'les justices',
  'la philosophie': 'les philosophies',
  'la littérature': 'les littératures',
  'l\'art': 'les arts',
  'la crise': 'les crises',
  'le progrès': 'les progrès',
  'la tradition': 'les traditions',
  'le comportement': 'les comportements',
  'l\'égalité': 'les égalités',
  'la dignité': 'les dignités',
  'la contradiction': 'les contradictions',
  'la perspective': 'les perspectives',
  'la stratégie': 'les stratégies',
  'le phénomène': 'les phénomènes',
  'la conscience': 'les consciences',
  'l\'ambition': 'les ambitions',
  'la révolution': 'les révolutions',
  'la corporation': 'les corporations',
  'la corruption': 'les corruptions',
  'la négociation': 'les négociations',
  'l\'analyse': 'les analyses',
  'l\'héritage': 'les héritages',
  'la vulnérabilité': 'les vulnérabilités',
  'la motivation': 'les motivations',
  'l\'idéologie': 'les idéologies',
  'la controverse': 'les controverses',
  'l\'innovation': 'les innovations',
  'la spéculation': 'les spéculations'
};

// Enrich entries
const enriched = data.map(entry => {
  const word = entry.word;
  const article = word.startsWith('l\'') ? '' : (word.startsWith('la') ? 'la' : (word.startsWith('le') ? 'le' : ''));

  return {
    word: entry.word,
    phonetic: entry.phonetic,
    part_of_speech: entry.part_of_speech,
    cefr_level: entry.cefr_level,
    category: entry.category,
    subcategory: entry.category.includes('Social') ? 'Social Issues' :
                 entry.category.includes('Politics') ? 'Government' :
                 entry.category.includes('Business') ? 'Professional' :
                 entry.category.includes('Education') ? 'Education' :
                 entry.category.includes('Science') ? 'Science' :
                 entry.category.includes('Culture') ? 'Culture' :
                 entry.category.includes('History') ? 'History' :
                 entry.category.includes('Literature') ? 'Literature' :
                 entry.category.includes('Art') ? 'Art' :
                 entry.category.includes('Media') ? 'Media' :
                 entry.category.includes('Environment') ? 'Environment' :
                 entry.category.includes('Abstract') ? 'Concepts' : entry.category,
    article: article,
    plural_form: plurals[word] || '',
    countability: 'C',
    regional_variant: 'France',
    frequency_rank: frequencyMap[entry.frequency] || 1500,
    primary_meaning: entry.primary_meaning,
    secondary_meaning: entry.secondary_meaning || '',
    usage_notes: `Use with contexts related to ${entry.primary_meaning.toLowerCase()}`,
    common_collocations: '',
    synonyms: '',
    antonyms: '',
    image_search_query: entry.image_search_query,
    image_context: entry.image_context,
    image_tags: entry.image_tags,
    example_1: entry.example_1,
    example_1_translation: entry.example_1_translation,
    example_2: entry.example_2,
    example_2_translation: entry.example_2_translation,
    example_3: entry.example_3 || `Le concept de "${entry.primary_meaning}" est important en français.`,
    example_3_translation: entry.example_3_translation || `The concept of "${entry.primary_meaning}" is important in French.`,
    pronunciation_tips: `Pronounce as: ${entry.phonetic}`,
    memory_hook: '',
    related_words: '',
    common_mistakes: '',
    learning_priority: 'high'
  };
});

// Write back
fs.writeFileSync(frFile, JSON.stringify(enriched, null, 2), 'utf-8');
console.log(`✓ Enriched ${enriched.length} entries`);
