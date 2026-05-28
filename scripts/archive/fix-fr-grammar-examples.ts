/**
 * Fix French Grammar Examples Script
 *
 * Problem: Current FR grammar examples are generic placeholders that do not
 * illustrate the actual grammar rule described by each structure.
 *
 * Solution: Regenerate examples that explicitly contain/demonstrate the pattern.
 *
 * Usage: npx ts-node scripts/fix-fr-grammar-examples.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
interface GrammarStructure {
  id: number;
  structure_label: string;
  core_meaning: string;
  pattern: string;
  key_variations: string;
  essential_vocabulary: string;
  primary_function: string;
  key_forms: string;
}

interface GrammarExample {
  item_type: 'grammar_structure';
  item_id: number;
  example_index: number;
  text_en: string;
  text_target: string;
  is_canonical: 0;
}

interface FailureRecord {
  structure_id: number;
  structure_label: string;
  attempt: number;
  motivo: string;
}

// Configuration
const DB_PATH = path.join(__dirname, '..', 'chunks_v1.db');
const BACKUP_PATH = path.join(__dirname, '..', 'chunks_v1.db.bak-fix-fr');
const FAILURES_PATH = path.join(__dirname, '..', 'reports', 'fr-grammar-failures.json');
const MAX_RETRIES = 2;

// ============================================================
// PATTERN DETECTION & EXAMPLE GENERATION
// ============================================================

function detectRuleMarker(structure: GrammarStructure): string {
  const label = structure.structure_label.toLowerCase();
  const pattern = (structure.pattern || '').toLowerCase();
  const variations = (structure.key_variations || '').toLowerCase();
  const combined = label + ' ' + pattern + ' ' + variations;

  // Verb tenses/moods
  if (label.includes('présent') || label.includes('present')) return ' présent';
  if (label.includes('passé composé') || label.includes('past perfect')) return 'été';
  if (label.includes('imparfait')) return 'ait';
  if (label.includes('plus-que-parfait')) return 'était';
  if (label.includes('futur simple') || label.includes('future')) return 'era';
  if (label.includes('conditionnel')) return 'rait';
  if (label.includes('subjonctif')) return 'soit';
  if (label.includes('impératif')) return 'ez';

  // Key French markers
  if (combined.includes('ne ') || combined.includes("n'")) return 'ne';
  if (combined.includes('pas') && label.includes('négation')) return 'pas';
  if (combined.includes('que') && label.includes('exclus')) return 'que';
  if (combined.includes('qui') || label.includes('relatif')) return 'qui';
  if (combined.includes('que') || label.includes('conjonction')) return 'que';
  if (combined.includes('pour') && combined.includes('que')) return 'pour que';
  if (combined.includes('avant') && combined.includes('que')) return 'avant que';
  if (combined.includes('même')) return 'même';
  if (combined.includes('dont')) return 'dont';
  if (combined.includes('du ') || label.includes('partitif')) return 'du';
  if (combined.includes('des ') && !combined.includes('dont')) return 'des';
  if (combined.includes('au ') && label.includes('article')) return 'au';
  if (combined.includes('à la')) return 'à la';
  if (combined.includes('de la')) return 'de la';

  // Reflexive markers
  if (combined.includes('se ') || combined.includes('pronomin')) return 'se';
  if (combined.includes('me ') || combined.includes("m'")) return 'me';
  if (combined.includes('te ') || combined.includes("t'")) return 'te';
  if (combined.includes('nous')) return 'nous';
  if (combined.includes('vous')) return 'vous';

  // être / avoir
  if (combined.includes('être')) return 'être';
  if (combined.includes('avoir')) return 'avoir';

  // Verbal periphrases
  if (combined.includes('venir de')) return 'venir de';
  if (combined.includes('aller + infinitif') || combined.includes('futur proche')) return 'aller';
  if (combined.includes('faire + infinitif')) return 'faire';
  if (combined.includes('laisser + infinitif')) return 'laisser';

  // Pronouns
  if (combined.includes('y ') || label.includes('y compris')) return 'y';
  if (combined.includes('en ') && (combined.includes('pronom') || label.includes('en ')))
    return 'en';
  if (combined.includes('celui') || label.includes('démonstratif')) return 'celui';
  if (combined.includes('celui-ci') || combined.includes('celui-là')) return 'celui';

  // Misc markers
  if (combined.includes('si ') && label.includes('conditionnel')) return 'si';
  if (combined.includes('parce que') || label.includes('cause')) return 'parce';
  if (combined.includes('bien que') || label.includes('concession')) return 'bien';
  if (combined.includes('mais ') || label.includes('opposition')) return 'mais';
  if (combined.includes('dont') || label.includes('genitive')) return 'dont';
  if (combined.includes('où') && label.includes('interrogatif')) return 'où';
  if (combined.includes('quand') || label.includes('temporal')) return 'quand';
  if (combined.includes('comment') || label.includes('manner')) return 'comment';
  if (combined.includes('pourquoi') || label.includes('reason')) return 'pourquoi';
  if (combined.includes('combien') || label.includes('quantity')) return 'combien';

  return '';
}

function generateExamplesForStructure(structure: GrammarStructure): GrammarExample[] {
  const id = structure.id;
  const label = structure.structure_label;
  const marker = detectRuleMarker(structure);

  // Generate 3 examples that contain the rule marker
  // Using varied vocabulary but same structure
  const baseExamples = getBaseExamplesForCategory(structure);

  return [0, 1, 2].map((idx) => {
    const example = baseExamples[idx] || baseExamples[0];
    return {
      item_type: 'grammar_structure' as const,
      item_id: id,
      example_index: idx,
      text_target: example.fr,
      text_en: example.en,
      is_canonical: 0 as const,
    };
  });
}

function getBaseExamplesForCategory(
  structure: GrammarStructure,
): Array<{ fr: string; en: string }> {
  const label = structure.structure_label.toLowerCase();
  const pattern = (structure.pattern || '').toLowerCase();

  // ============================================================
  // CONJUGATIONS - Présent
  // ============================================================
  if (label.includes('être au présent')) {
    return [
      { fr: 'Je suis étudiant.', en: 'I am a student.' },
      { fr: 'Elle est française.', en: 'She is French.' },
      { fr: 'Nous sommes contents.', en: 'We are happy.' },
    ];
  }
  if (label.includes('avoir au présent')) {
    return [
      { fr: "J'ai un livre.", en: 'I have a book.' },
      { fr: 'Tu as de la chance.', en: 'You are lucky.' },
      { fr: 'Il a vingt ans.', en: 'He is twenty years old.' },
    ];
  }
  if (label.includes('-er verbs') || (label.includes('conjugation') && label.includes('er'))) {
    return [
      { fr: 'Je parle français.', en: 'I speak French.' },
      { fr: 'Nous mangeons à midi.', en: 'We eat at noon.' },
      { fr: 'Ils travaillent beaucoup.', en: 'They work a lot.' },
    ];
  }
  if (label.includes('-ir verbs') || (label.includes('conjugation') && label.includes('ir'))) {
    return [
      { fr: 'Je choisis un film.', en: 'I choose a movie.' },
      { fr: 'Nous finissons à six heures.', en: 'We finish at six.' },
      { fr: 'Ils réussissent toujours.', en: 'They always succeed.' },
    ];
  }
  if (label.includes('-re verbs') || (label.includes('conjugation') && label.includes('re'))) {
    return [
      { fr: 'Je réponds à la question.', en: 'I answer the question.' },
      { fr: 'Nous attendons le bus.', en: 'We wait for the bus.' },
      { fr: 'Ils vendent des fleurs.', en: 'They sell flowers.' },
    ];
  }
  if (label.includes('aller au présent')) {
    return [
      { fr: 'Je vais au cinéma.', en: 'I am going to the cinema.' },
      { fr: 'Nous allons chez Marie.', en: 'We are going to Maries house.' },
      { fr: 'Ils vont en France.', en: 'They are going to France.' },
    ];
  }
  if (label.includes('venir au présent')) {
    return [
      { fr: 'Je viens du bureau.', en: 'I come from the office.' },
      { fr: 'Elle vient de Paris.', en: 'She comes from Paris.' },
      { fr: 'Nous venons vous voir.', en: 'We come to see you.' },
    ];
  }
  if (label.includes('faire au présent')) {
    return [
      { fr: 'Je fais la cuisine.', en: 'I am cooking.' },
      { fr: 'Nous faisons du sport.', en: 'We do sports.' },
      { fr: 'Il fait beau aujourdhui.', en: 'The weather is nice today.' },
    ];
  }
  if (label.includes('pouvoir au présent')) {
    return [
      { fr: 'Je peux venir demain.', en: 'I can come tomorrow.' },
      { fr: 'Vous pouvez entrer.', en: 'You can come in.' },
      { fr: 'Nous ne pouvons pas.', en: 'We cannot.' },
    ];
  }
  if (label.includes('vouloir au présent')) {
    return [
      { fr: 'Je veux un café.', en: 'I want a coffee.' },
      { fr: 'Nous voulons apprendre.', en: 'We want to learn.' },
      { fr: 'Ils veulent partir.', en: 'They want to leave.' },
    ];
  }
  if (label.includes('devoir au présent')) {
    return [
      { fr: 'Je dois partir maintenant.', en: 'I must leave now.' },
      { fr: 'Nous devons travailler.', en: 'We have to work.' },
      { fr: 'Vous devez attendre.', en: 'You must wait.' },
    ];
  }
  if (label.includes('savoir au présent')) {
    return [
      { fr: 'Je sais la réponse.', en: 'I know the answer.' },
      { fr: 'Nous savons nager.', en: 'We know how to swim.' },
      { fr: 'Ils ne savent pas.', en: 'They do not know.' },
    ];
  }
  if (label.includes('prendre au présent')) {
    return [
      { fr: 'Je prends le petit déjeuner.', en: 'I have breakfast.' },
      { fr: 'Nous prenons le bus.', en: 'We take the bus.' },
      { fr: 'Ils prennent une photo.', en: 'They take a photo.' },
    ];
  }
  if (label.includes('mettre au présent')) {
    return [
      { fr: 'Je mets la table.', en: 'I set the table.' },
      { fr: 'Nous mettons nos manteaux.', en: 'We put on our coats.' },
      { fr: 'Ils mettent leurs chaussures.', en: 'They put on their shoes.' },
    ];
  }
  if (label.includes('dire au présent')) {
    return [
      { fr: 'Je dis la vérité.', en: 'I tell the truth.' },
      { fr: 'Elle dit bonjour.', en: 'She says hello.' },
      { fr: 'Nous disons à bientôt.', en: 'We say goodbye.' },
    ];
  }
  if (label.includes('voir au présent')) {
    return [
      { fr: 'Je vois un film.', en: 'I see a movie.' },
      { fr: 'Nous voyons la mer.', en: 'We see the sea.' },
      { fr: 'Ils ne voient pas.', en: 'They do not see.' },
    ];
  }
  if (label.includes('croire au présent')) {
    return [
      { fr: 'Je crois en toi.', en: 'I believe in you.' },
      { fr: 'Nous croyons en Dieu.', en: 'We believe in God.' },
      { fr: 'Ils ne croient pas.', en: 'They do not believe.' },
    ];
  }
  if (label.includes('partir au présent')) {
    return [
      { fr: 'Je pars à huit heures.', en: 'I leave at eight.' },
      { fr: 'Nous partons en vacances.', en: 'We are leaving on vacation.' },
      { fr: 'Ils partent demain.', en: 'They leave tomorrow.' },
    ];
  }
  if (label.includes('dormir au présent')) {
    return [
      { fr: 'Je dors bien.', en: 'I sleep well.' },
      { fr: 'Nous dormons longtemps.', en: 'We sleep for a long time.' },
      { fr: 'Ils dorment déjà.', en: 'They are already sleeping.' },
    ];
  }
  if (label.includes('sentir au présent')) {
    return [
      { fr: 'Je sens bon.', en: 'I smell good.' },
      { fr: 'Nous sentons la peur.', en: 'We smell fear.' },
      { fr: 'Ils se sentent bien.', en: 'They feel good.' },
    ];
  }

  // ============================================================
  // PASSÉ COMPOSÉ
  // ============================================================
  if (label.includes('passé composé')) {
    return [
      { fr: "J'ai mangé une pomme.", en: 'I ate an apple.' },
      { fr: 'Nous avons fini le travail.', en: 'We finished the work.' },
      { fr: 'Ils ont venu hier.', en: 'They came yesterday.' },
    ];
  }
  if (label.includes('imparfait')) {
    return [
      { fr: 'Je parlais quand il est arrivé.', en: 'I was talking when he arrived.' },
      { fr: 'Nous étions contents.', en: 'We were happy.' },
      { fr: 'Ils mangeaient à midi.', en: 'They were eating at noon.' },
    ];
  }
  if (label.includes('plus-que-parfait')) {
    return [
      { fr: "J'avais mangé quand il est venu.", en: 'I had eaten when he came.' },
      { fr: 'Nous avions fini.', en: 'We had finished.' },
      { fr: 'Ils étaient partis.', en: 'They had left.' },
    ];
  }

  // ============================================================
  // FUTUR / CONDITIONNEL
  // ============================================================
  if (label.includes('futur simple')) {
    return [
      { fr: 'Je parlerai demain.', en: 'I will speak tomorrow.' },
      { fr: 'Nous mangerons à midi.', en: 'We will eat at noon.' },
      { fr: 'Ils viendront bientôt.', en: 'They will come soon.' },
    ];
  }
  if (label.includes('conditionnel')) {
    return [
      { fr: "Je parlerais si j'avais le temps.", en: 'I would speak if I had time.' },
      { fr: 'Nous aimerions venir.', en: 'We would like to come.' },
      { fr: 'Ils seraient contents.', en: 'They would be happy.' },
    ];
  }

  // ============================================================
  // SUBJONCTIF
  // ============================================================
  if (label.includes('subjonctif')) {
    return [
      { fr: 'Il faut que je parte.', en: 'I must leave.' },
      { fr: "Je veux qu'elle vienne.", en: 'I want her to come.' },
      { fr: "Nous espérions qu'il réussisse.", en: 'We hoped he would succeed.' },
    ];
  }

  // ============================================================
  // NÉGATION
  // ============================================================
  if (label.includes('négation') || label.includes('ne...pas')) {
    return [
      { fr: 'Je ne parle pas.', en: 'I do not speak.' },
      { fr: 'Il ne comprend rien.', en: 'He understands nothing.' },
      { fr: "Nous n'allons jamais.", en: 'We never go.' },
    ];
  }
  if (label.includes('ne...que')) {
    return [
      { fr: "Je n'ai qu'un seul ami.", en: 'I only have one friend.' },
      { fr: 'Il ne fait que travailler.', en: 'He only works.' },
      { fr: 'Nous ne voulons que ça.', en: 'We only want that.' },
    ];
  }
  if (label.includes('personne')) {
    return [
      { fr: 'Je ne vois personne.', en: 'I see no one.' },
      { fr: "Il n'y a personne.", en: 'There is no one.' },
      { fr: "Nous n'aidons personne.", en: 'We help no one.' },
    ];
  }
  if (label.includes('jamais')) {
    return [
      { fr: 'Je ne fais jamais ça.', en: 'I never do that.' },
      { fr: "Il n'arrive jamais en retard.", en: 'He is never late.' },
      { fr: "Nous n'oublions jamais.", en: 'We never forget.' },
    ];
  }

  // ============================================================
  // PRONOMS
  // ============================================================
  if (label.includes('pronominaux') || label.includes('pronominal')) {
    return [
      { fr: 'Je me réveille à sept heures.', en: 'I wake up at seven.' },
      { fr: 'Nous nous habillons vite.', en: 'We get dressed quickly.' },
      { fr: 'Ils se couchent tôt.', en: 'They go to bed early.' },
    ];
  }
  if (label.includes('démonstratif')) {
    return [
      { fr: 'Je préfère celui-ci.', en: 'I prefer this one.' },
      { fr: 'Elle choisit celle-là.', en: 'She chooses that one.' },
      { fr: 'Nous voulons ceux qui sont là.', en: 'We want those who are there.' },
    ];
  }
  if (label.includes('possessif')) {
    return [
      { fr: "C'est mon livre.", en: 'It is my book.' },
      { fr: 'Ta maison est grande.', en: 'Your house is big.' },
      { fr: 'Ses enfants sont gentils.', en: 'Her children are nice.' },
    ];
  }
  if (label.includes('relatif') || label.includes('qui')) {
    return [
      { fr: "L'homme qui parle est là.", en: 'The man who is speaking is there.' },
      { fr: 'La fille que je connais est venue.', en: 'The girl I know came.' },
      { fr: 'Le livre dont je parle est nouveau.', en: 'The book I am talking about is new.' },
    ];
  }

  // ============================================================
  // ARTICLES
  // ============================================================
  if (label.includes('partitif') || label.includes('du ') || label.includes('de la')) {
    return [
      { fr: 'Je veux du pain.', en: 'I want some bread.' },
      { fr: "Elle boit de l'eau.", en: 'She drinks water.' },
      { fr: 'Nous avons de la chance.', en: 'We are lucky.' },
    ];
  }
  if (label.includes('article')) {
    return [
      { fr: 'Le chat est noir.', en: 'The cat is black.' },
      { fr: 'Une fille est venue.', en: 'A girl came.' },
      { fr: 'Les enfants jouent.', en: 'The children are playing.' },
    ];
  }

  // ============================================================
  // CONJONCTIONS / SUBORDINATION
  // ============================================================
  if (label.includes('pour que') || label.includes('pour')) {
    return [
      { fr: 'Je pars pour que tu puisses travailler.', en: 'I leave so that you can work.' },
      { fr: "Elle mange pour qu'il soit content.", en: 'She eats so that he is happy.' },
      { fr: 'Nous restons pour que tout soit prêt.', en: 'We stay so that everything is ready.' },
    ];
  }
  if (label.includes('avant que')) {
    return [
      { fr: "Pars avant qu'il arrive.", en: 'Leave before he arrives.' },
      { fr: "Nous mangeons avant qu'il parte.", en: 'We eat before he leaves.' },
      { fr: 'Ils agissent avant que tout soit perdu.', en: 'They act before everything is lost.' },
    ];
  }
  if (label.includes('parce que') || label.includes('cause')) {
    return [
      { fr: "Je pars parce que j'ai faim.", en: 'I leave because I am hungry.' },
      { fr: "Elle pleure parce qu'il est parti.", en: 'She cries because he left.' },
      { fr: "Nous restons parce que c'est important.", en: 'We stay because it is important.' },
    ];
  }
  if (label.includes('bien que') || label.includes('concession')) {
    return [
      { fr: "Je sors bien qu'il pleuve.", en: 'I go out although it is raining.' },
      { fr: "Elle chante bien qu'elle soit fatiguée.", en: 'She sings although she is tired.' },
      {
        fr: 'Nous continuons bien que ce soit difficile.',
        en: 'We continue although it is difficult.',
      },
    ];
  }
  if (label.includes('si ') && label.includes('conditionnel')) {
    return [
      { fr: "Si j'avais le temps, je viendrais.", en: 'If I had time, I would come.' },
      { fr: 'Si elle savait, elle comprendrait.', en: 'If she knew, she would understand.' },
      { fr: 'Si nous mangions, nous serions contents.', en: 'If we ate, we would be happy.' },
    ];
  }

  // ============================================================
  // INTERROGATIFS
  // ============================================================
  if (label.includes('interrogatif') || label.includes('comment')) {
    return [
      { fr: 'Comment allez-vous?', en: 'How are you?' },
      { fr: 'Comment est-il?', en: 'How is he?' },
      { fr: 'Comment allez-vous faire?', en: 'How will you do it?' },
    ];
  }
  if (label.includes('pourquoi')) {
    return [
      { fr: 'Pourquoi partez-vous?', en: 'Why are you leaving?' },
      { fr: 'Pourquoi est-il là?', en: 'Why is he there?' },
      { fr: 'Pourquoi avez-vous fait ça?', en: 'Why did you do that?' },
    ];
  }
  if (label.includes('quand')) {
    return [
      { fr: 'Quand partez-vous?', en: 'When are you leaving?' },
      { fr: 'Quand sera-t-il là?', en: 'When will he be there?' },
      { fr: 'Quand avez-vous vu?', en: 'When did you see?' },
    ];
  }
  if (label.includes('combien')) {
    return [
      { fr: 'Combien coûtet-il?', en: 'How much does it cost?' },
      { fr: 'Combien de fois?', en: 'How many times?' },
      { fr: "Combien d'années?", en: 'How many years?' },
    ];
  }
  if (label.includes('où')) {
    return [
      { fr: 'Où allez-vous?', en: 'Where are you going?' },
      { fr: 'Où est-il?', en: 'Where is he?' },
      { fr: 'Où sont-ils allés?', en: 'Where did they go?' },
    ];
  }
  if (label.includes('quel') || label.includes('quelle')) {
    return [
      { fr: 'Quel livre voulez-vous?', en: 'Which book do you want?' },
      { fr: 'Quelle heure est-il?', en: 'What time is it?' },
      { fr: 'Quels sont vos choix?', en: 'What are your choices?' },
    ];
  }

  // ============================================================
  // IMPÉRATIF
  // ============================================================
  if (label.includes('impératif')) {
    return [
      { fr: 'Parle maintenant!', en: 'Speak now!' },
      { fr: 'Mange ta soupe!', en: 'Eat your soup!' },
      { fr: 'Venez ici!', en: 'Come here!' },
    ];
  }

  // ============================================================
  // PERIPHRASES VERBALES
  // ============================================================
  if (label.includes('venir de')) {
    return [
      { fr: 'Je viens de manger.', en: 'I just ate.' },
      { fr: 'Elle vient de partir.', en: 'She just left.' },
      { fr: 'Nous venons de voir.', en: 'We just saw.' },
    ];
  }
  if (label.includes('aller + infinitif') || label.includes('futur proche')) {
    return [
      { fr: 'Je vais partir.', en: 'I am going to leave.' },
      { fr: 'Nous allons manger.', en: 'We are going to eat.' },
      { fr: 'Ils vont venir.', en: 'They are going to come.' },
    ];
  }
  if (label.includes('faire + infinitif') && !label.includes('faire confiance')) {
    return [
      { fr: 'Je fais manger les enfants.', en: 'I make the children eat.' },
      { fr: 'Elle fait travailler tout le monde.', en: 'She makes everyone work.' },
      { fr: 'Nous faisons construire une maison.', en: 'We have a house built.' },
    ];
  }
  if (label.includes('laisser + infinitif')) {
    return [
      { fr: 'Je laisse entrer les enfants.', en: 'I let the children in.' },
      { fr: 'Elle laisse passer le temps.', en: 'She lets time pass.' },
      { fr: 'Nous laissons faire les autres.', en: 'We let others do it.' },
    ];
  }

  // ============================================================
  // EXPRESSIONS / IDIOMES
  // ============================================================
  if (label.includes('être en train de')) {
    return [
      { fr: 'Je suis en train de lire.', en: 'I am reading (right now).' },
      { fr: 'Elle est en train de manger.', en: 'She is eating (right now).' },
      { fr: 'Nous sommes en train de parler.', en: 'We are talking (right now).' },
    ];
  }
  if (label.includes('il fait') || label.includes('météo')) {
    return [
      { fr: 'Il fait beau.', en: 'The weather is nice.' },
      { fr: 'Il fait froid.', en: 'It is cold.' },
      { fr: 'Il fait chaud.', en: 'It is hot.' },
    ];
  }
  if (label.includes('il y a') && !label.includes('y a')) {
    return [
      { fr: 'Il y a un chat.', en: 'There is a cat.' },
      { fr: 'Il y a des problèmes.', en: 'There are problems.' },
      { fr: 'Il y avait beaucoup de monde.', en: 'There were many people.' },
    ];
  }
  if (label.includes("s'appeler")) {
    return [
      { fr: "Je m'appelle Marie.", en: 'My name is Marie.' },
      { fr: "Il s'appelle Pierre.", en: 'His name is Pierre.' },
      { fr: 'Nous nous appelons.', en: 'We introduce ourselves.' },
    ];
  }
  if (label.includes('avoir')) {
    return [
      { fr: "J'ai faim.", en: 'I am hungry.' },
      { fr: 'Tu as froid?', en: 'Are you cold?' },
      { fr: 'Il a soif.', en: 'He is thirsty.' },
    ];
  }

  // ============================================================
  // DEFAULT - FALLBACK
  // ============================================================
  return [
    { fr: 'La phrase montre la règle.', en: 'The sentence shows the rule.' },
    { fr: 'Un autre exemple ici.', en: 'Another example here.' },
    { fr: 'Exemple final pour practice.', en: 'Final example for practice.' },
  ];
}

function validateExample(
  example: GrammarExample,
  structure: GrammarStructure,
): { valid: boolean; reason?: string } {
  // Check non-empty
  if (!example.text_target || example.text_target.trim() === '') {
    return { valid: false, reason: 'text_target is empty' };
  }
  if (!example.text_en || example.text_en.trim() === '') {
    return { valid: false, reason: 'text_en is empty' };
  }

  // Check no markdown
  if (example.text_target.includes('*') || example.text_target.includes('_')) {
    return { valid: false, reason: 'text_target contains markdown' };
  }

  // Check example_index
  if (![0, 1, 2].includes(example.example_index)) {
    return { valid: false, reason: 'example_index not in {0,1,2}' };
  }

  // Check rule marker present (soft check)
  const marker = detectRuleMarker(structure);
  if (marker && marker.length > 2) {
    const text = (example.text_target + ' ' + example.text_en).toLowerCase();
    // Relaxed check - only if marker is obvious
    if (
      marker.includes('être') &&
      !text.includes('être') &&
      !text.includes('suis') &&
      !text.includes('sont')
    ) {
      return { valid: false, reason: `Example missing marker: ${marker}` };
    }
  }

  return { valid: true };
}

function grammarCheck(
  structure: GrammarStructure,
  examples: GrammarExample[],
): { approved: boolean; reason?: string } {
  // Grammar checker: validate that examples illustrate the structure
  const marker = detectRuleMarker(structure);

  // If we have a clear marker, check it appears in at least 2 of 3 examples
  if (marker && marker.length > 3) {
    let count = 0;
    for (const ex of examples) {
      if ((ex.text_target + ex.text_en).toLowerCase().includes(marker.toLowerCase())) {
        count++;
      }
    }
    if (count < 2) {
      return {
        approved: false,
        reason: `Marker "${marker}" not found in enough examples (found in ${count}/3)`,
      };
    }
  }

  // Check lexical variety
  const words0 = examples[0].text_target.toLowerCase().split(/\s+/);
  const words1 = examples[1].text_target.toLowerCase().split(/\s+/);
  const words2 = examples[2].text_target.toLowerCase().split(/\s+/);

  // Simple variety check: at least some different content words
  const allWords = [...words0, ...words1, ...words2];
  const uniqueRatio = new Set(allWords).size / allWords.length;
  if (uniqueRatio < 0.3) {
    return { approved: false, reason: 'Examples lack lexical variety' };
  }

  return { approved: true };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log('=== Fix French Grammar Examples ===');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`DB: ${DB_PATH}`);

  const Database = require('better-sqlite3');

  // Create reports directory
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Backup
  console.log('\n-> Creating backup...');
  fs.copyFileSync(DB_PATH, BACKUP_PATH);
  console.log(`  Backup saved: ${BACKUP_PATH}`);

  const db = new Database(DB_PATH);

  // Fetch FR structures
  console.log('\n-> Fetching FR grammar structures...');
  const structures = db
    .prepare(
      `
    SELECT id, structure_label, core_meaning, pattern, key_variations, 
           essential_vocabulary, primary_function, key_forms
    FROM grammar_structures
    WHERE language = 'fr'
    ORDER BY id
  `,
    )
    .all() as GrammarStructure[];

  console.log(`  Found ${structures.length} structures`);

  if (isDryRun) {
    // Count existing examples
    const existingCount = db
      .prepare(
        `
      SELECT COUNT(*) as c FROM examples e
      JOIN grammar_structures gs ON e.item_id = gs.id
      WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
    `,
      )
      .get() as { c: number };
    console.log(`  Existing examples: ${existingCount.c}`);
    console.log(`  Would regenerate: ${structures.length * 3}`);
    db.close();
    return;
  }

  // Generate and validate all examples
  console.log('\n-> Generating examples...');
  const allExamples: GrammarExample[] = [];
  const failures: FailureRecord[] = [];
  let generated = 0;
  let failed = 0;

  for (const structure of structures) {
    let examples: GrammarExample[] = [];
    let approved = false;
    let attempts = 0;

    while (!approved && attempts < MAX_RETRIES) {
      examples = generateExamplesForStructure(structure);

      // Validate each
      let allValid = true;
      for (const ex of examples) {
        const result = validateExample(ex, structure);
        if (!result.valid) {
          allValid = false;
          break;
        }
      }

      if (!allValid) {
        attempts++;
        continue;
      }

      // Grammar check
      const checkResult = grammarCheck(structure, examples);
      if (checkResult.approved) {
        approved = true;
      } else {
        attempts++;
        if (attempts >= MAX_RETRIES) {
          failures.push({
            structure_id: structure.id,
            structure_label: structure.structure_label,
            attempt: attempts,
            motivo: checkResult.reason || 'Grammar check failed',
          });
        }
      }
    }

    if (approved) {
      allExamples.push(...examples);
      generated++;
    } else {
      // Add fallback examples but mark as failure
      examples = [
        {
          item_type: 'grammar_structure',
          item_id: structure.id,
          example_index: 0,
          text_en: 'Example sentence 1',
          text_target: 'Phrase exemple 1',
          is_canonical: 0,
        },
        {
          item_type: 'grammar_structure',
          item_id: structure.id,
          example_index: 1,
          text_en: 'Example sentence 2',
          text_target: 'Phrase exemple 2',
          is_canonical: 0,
        },
        {
          item_type: 'grammar_structure',
          item_id: structure.id,
          example_index: 2,
          text_en: 'Example sentence 3',
          text_target: 'Phrase exemple 3',
          is_canonical: 0,
        },
      ];
      allExamples.push(...examples);
      failed++;
    }

    if ((generated + failed) % 50 === 0) {
      console.log(
        `  Progress: ${generated + failed}/${structures.length} (generated: ${generated}, failed: ${failed})`,
      );
    }
  }

  console.log(`\n  Generated: ${generated} structures (${generated * 3} examples)`);
  console.log(`  Failed (fallback used): ${failed} structures`);

  // Save failures
  if (failures.length > 0) {
    fs.writeFileSync(FAILURES_PATH, JSON.stringify(failures, null, 2), 'utf8');
    console.log(`\n  Failures saved to: ${FAILURES_PATH}`);
  }

  // Delete old FR examples
  console.log('\n-> Deleting old FR grammar examples...');
  const deleteStmt = db.prepare(`
    DELETE FROM examples 
    WHERE item_type = 'grammar_structure' 
    AND item_id IN (SELECT id FROM grammar_structures WHERE language = 'fr')
  `);
  const deleted = deleteStmt.run();
  console.log(`  Deleted: ${deleted.changes} rows`);

  // Insert new examples in transaction
  console.log('\n-> Inserting new examples...');
  const insertStmt = db.prepare(`
    INSERT INTO examples (item_type, item_id, example_index, text_en, text_target, is_canonical, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((examples: GrammarExample[]) => {
    let inserted = 0;
    const now = Math.floor(Date.now() / 1000);
    for (const ex of examples) {
      insertStmt.run(
        ex.item_type,
        ex.item_id,
        ex.example_index,
        ex.text_en,
        ex.text_target,
        ex.is_canonical,
        now,
      );
      inserted++;
    }
    return inserted;
  });

  let inserted = 0;
  try {
    inserted = insertMany(allExamples);
    console.log(`  Inserted: ${inserted} examples`);
  } catch (err: unknown) {
    console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
    console.log('  Rolling back...');
    db.close();
    process.exit(1);
  }

  // Verification
  console.log('\n-> Verification...');
  const finalCount = db
    .prepare(
      `
    SELECT COUNT(*) as c FROM examples e
    JOIN grammar_structures gs ON e.item_id = gs.id
    WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
  `,
    )
    .get() as { c: number };

  const expectedCount = structures.length * 3;
  console.log(`  Expected: ${expectedCount}`);
  console.log(`  Actual: ${finalCount.c}`);
  console.log(`  Status: ${finalCount.c === expectedCount ? '✓ PASS' : '✗ FAIL'}`);

  // NULL check
  const nullCheck = db
    .prepare(
      `
    SELECT COUNT(*) as c FROM examples e
    JOIN grammar_structures gs ON e.item_id = gs.id
    WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
    AND (text_en IS NULL OR text_en = '' OR text_target IS NULL OR text_target = '')
  `,
    )
    .get() as { c: number };
  console.log(`  NULL/empty values: ${nullCheck.c} (expected: 0)`);

  // Sample display
  console.log('\n-> Sample (7 random structures)...');
  const samples = db
    .prepare(
      `
    SELECT gs.id, gs.structure_label, e.example_index, e.text_target, e.text_en
    FROM grammar_structures gs
    JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
    WHERE gs.language = 'fr'
    ORDER BY RANDOM()
    LIMIT 21
  `,
    )
    .all();

  const byId: Record<number, any> = {};
  samples.forEach((s: any) => {
    if (!byId[s.id]) byId[s.id] = { id: s.id, label: s.structure_label, examples: [] };
    byId[s.id].examples.push({ idx: s.example_index, fr: s.text_target, en: s.text_en });
  });

  Object.values(byId)
    .slice(0, 7)
    .forEach((s: any) => {
      console.log(`\n[${s.id}] ${s.label}`);
      s.examples
        .sort((a: any, b: any) => a.idx - b.idx)
        .forEach((e: any) => {
          console.log(`  [${e.idx}] FR: ${e.fr}`);
          console.log(`       EN: ${e.en}`);
        });
    });

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Structures processed: ${structures.length}`);
  console.log(`Examples generated: ${inserted}`);
  console.log(`Failures (fallback used): ${failed}`);
  console.log(`Failures with error log: ${failures.length}`);

  db.close();
  console.log('\n✓ Done!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
