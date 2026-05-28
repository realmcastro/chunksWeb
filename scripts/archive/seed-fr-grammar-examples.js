/**
 * Seed French Grammar Examples Script
 * Generates and inserts 3 pedagogical examples for each French grammar structure.
 *
 * Usage: node scripts/seed-fr-grammar-examples.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Types
/** @type {import('better-sqlite3').Database} */
let Database;

const DB_PATH = path.join(__dirname, '..', 'chunks_v1.db');
const BACKUP_PATH = path.join(__dirname, '..', 'chunks_v1.db.bak');
const BATCH_SIZE = 15;

function generateExamplesForStructure(gs) {
  const label = gs.structure_label;
  const id = gs.id;

  // Template rules based on structure type
  let templates = [];
  let enTemplates = [];

  const l = label.toLowerCase();

  if (l.includes('être') && l.includes('présent')) {
    templates = ['Je suis français.', 'Elle est professeur.', 'Nous sommes contents.'];
    enTemplates = ['I am French.', 'She is a teacher.', 'We are happy.'];
  } else if (l.includes('avoir') && l.includes('présent')) {
    templates = ["J'ai un chat.", 'Tu as un problème.', 'Il a vingt ans.'];
    enTemplates = ['I have a cat.', 'You have a problem.', 'He is twenty years old.'];
  } else if (l.includes('-er') && l.includes('conjugation')) {
    templates = ['Je parle français.', 'Nous mangeons à midi.', 'Ils travaillent beaucoup.'];
    enTemplates = ['I speak French.', 'We eat at noon.', 'They work a lot.'];
  } else if (l.includes('-ir') && l.includes('conjugation')) {
    templates = [
      'Je choisis un film.',
      'Nous finissons à six heures.',
      'Ils réussissent toujours.',
    ];
    enTemplates = ['I choose a movie.', 'We finish at six oclock.', 'They always succeed.'];
  } else if (l.includes('-re') && l.includes('conjugation')) {
    templates = ['Je réponds à la question.', 'Nous attendons le bus.', 'Ils vendent des fleurs.'];
    enTemplates = ['I answer the question.', 'We wait for the bus.', 'They sell flowers.'];
  } else if (l.includes('aller') && l.includes('présent')) {
    templates = ['Je vais au cinéma.', 'Nous allons chez Marie.', 'Ils vont en France.'];
    enTemplates = [
      'I am going to the cinema.',
      'We are going to Maries house.',
      'They are going to France.',
    ];
  } else if (l.includes('venir') && l.includes('présent')) {
    templates = ['Je viens du bureau.', 'Elle vient de Paris.', 'Nous venons vous voir.'];
    enTemplates = ['I come from the office.', 'She comes from Paris.', 'We come to see you.'];
  } else if (l.includes('faire') && l.includes('présent')) {
    templates = ['Je fais la cuisine.', 'Nous faisons du sport.', 'Il fait beau aujourdhui.'];
    enTemplates = ['I am cooking.', 'We do sports.', 'The weather is nice today.'];
  } else if (l.includes('pouvoir') && l.includes('présent')) {
    templates = ['Je peux venir demain.', 'Vous pouvez entrer.', 'Nous ne pouvons pas.'];
    enTemplates = ['I can come tomorrow.', 'You can come in.', 'We cannot.'];
  } else if (l.includes('vouloir') && l.includes('présent')) {
    templates = ['Je veux un café.', 'Nous voulons apprendre.', 'Ils veulent partir.'];
    enTemplates = ['I want a coffee.', 'We want to learn.', 'They want to leave.'];
  } else if (l.includes('devoir') && l.includes('présent')) {
    templates = ['Je dois partir maintenant.', 'Nous devons travailler.', 'Vous devez attendre.'];
    enTemplates = ['I must leave now.', 'We have to work.', 'You must wait.'];
  } else if (l.includes('négation')) {
    templates = ['Je ne parle pas.', 'Il ne comprend rien.', 'Nous nallons jamais.'];
    enTemplates = ['I do not speak.', 'He understands nothing.', 'We never go.'];
  } else if (l.includes('pronomin')) {
    templates = [
      'Je me réveille à sept heures.',
      'Nous nous habillons vite.',
      'Ils se couchent tôt.',
    ];
    enTemplates = ['I wake up at seven.', 'We get dressed quickly.', 'They go to bed early.'];
  } else if (l.includes('dire') && l.includes('présent')) {
    templates = ['Je dis la vérité.', 'Elle dit bonjour.', 'Nous disons à bientôt.'];
    enTemplates = ['I tell the truth.', 'She says hello.', 'We say goodbye.'];
  } else if (l.includes('voir') && l.includes('présent')) {
    templates = ['Je vois un film.', 'Nous voyons la mer.', 'Ils ne voient pas.'];
    enTemplates = ['I see a movie.', 'We see the sea.', 'They do not see.'];
  } else if (l.includes('savoir') && l.includes('présent')) {
    templates = ['Je sais la réponse.', 'Nous savons nager.', 'Ils ne savent pas.'];
    enTemplates = ['I know the answer.', 'We know how to swim.', 'They do not know.'];
  } else if (l.includes('prendre') && l.includes('présent')) {
    templates = ['Je prends le petit déjeuner.', 'Nous prenons le bus.', 'Ils prennent une photo.'];
    enTemplates = ['I have breakfast.', 'We take the bus.', 'They take a photo.'];
  } else if (l.includes('mettre') && l.includes('présent')) {
    templates = [
      'Je mets la table.',
      'Nous mettons nos manteaux.',
      'Ils mettent leurs chaussures.',
    ];
    enTemplates = ['I set the table.', 'We put on our coats.', 'They put on their shoes.'];
  } else if (l.includes('croire') && l.includes('présent')) {
    templates = ['Je crois en toi.', 'Nous croyons en Dieu.', 'Ils ne croient pas.'];
    enTemplates = ['I believe in you.', 'We believe in God.', 'They do not believe.'];
  } else if (l.includes('partir') && l.includes('présent')) {
    templates = ['Je pars à huit heures.', 'Nous partons en vacances.', 'Ils partent demain.'];
    enTemplates = ['I leave at eight.', 'We are leaving on vacation.', 'They leave tomorrow.'];
  } else if (l.includes('dormir') && l.includes('présent')) {
    templates = ['Je dors bien.', 'Nous dormons longtemps.', 'Ils dorment déjà.'];
    enTemplates = ['I sleep well.', 'We sleep for a long time.', 'They are already sleeping.'];
  } else if (l.includes('servir') && l.includes('présent')) {
    templates = ['Je sers le dîner.', 'Nous servons les clients.', 'Ils servent du vin.'];
    enTemplates = ['I serve dinner.', 'We serve the clients.', 'They serve wine.'];
  } else if (l.includes('ouvrir') && l.includes('présent')) {
    templates = ["J'ouvre la porte.", 'Nous ouvrons la fenêtre.', 'Ils ouvrent le magazin.'];
    enTemplates = ['I open the door.', 'We open the window.', 'They open the store.'];
  } else if (l.includes('offrir') && l.includes('présent')) {
    templates = ["J'offre un cadeau.", 'Nous offrons des fleurs.', 'Ils offrent du café.'];
    enTemplates = ['I offer a gift.', 'We offer flowers.', 'They offer coffee.'];
  } else if (l.includes('écrire') && l.includes('présent')) {
    templates = ["J'écris une lettre.", 'Nous écrivons un livre.', 'Ils écrivent beaucoup.'];
    enTemplates = ['I write a letter.', 'We write a book.', 'They write a lot.'];
  } else if (l.includes('lire') && l.includes('présent')) {
    templates = ['Je lis un roman.', 'Nous lisons le journal.', 'Ils lisent souvent.'];
    enTemplates = ['I read a novel.', 'We read the newspaper.', 'They read often.'];
  } else if (l.includes('vivre') && l.includes('présent')) {
    templates = ['Je vis à Paris.', 'Nous vives en France.', 'Ils vivent bien.'];
    enTemplates = ['I live in Paris.', 'We live in France.', 'They live well.'];
  } else if (l.includes('rire') && l.includes('présent')) {
    templates = ['Je ris de cette blague.', 'Nous rions ensemble.', 'Ils ne rient jamais.'];
    enTemplates = ['I laugh at this joke.', 'We laugh together.', 'They never laugh.'];
  } else if (l.includes('suivre') && l.includes('présent')) {
    templates = ['Je suis le cours.', 'Nous suivons les actualités.', 'Ils suivent les règles.'];
    enTemplates = ['I follow the course.', 'We follow the news.', 'They follow the rules.'];
  } else if (l.includes('recevoir') && l.includes('présent')) {
    templates = ['Je reçois une lettre.', 'Nous recevons des amis.', 'Ils reçoivent un cadeau.'];
    enTemplates = ['I receive a letter.', 'We receive friends.', 'They receive a gift.'];
  } else if (l.includes('devenir') && l.includes('présent')) {
    templates = ['Je deviens старый.', 'Nous devenons forts.', 'Ils deviennent famosos.'];
    enTemplates = ['I am becoming old.', 'We are becoming strong.', 'They are becoming famous.'];
  } else if (l.includes('revnir') && l.includes('présent')) {
    templates = ['Je reviens demain.', 'Nous revnons de voyage.', 'Ils revnennent tard.'];
    enTemplates = [
      'I am coming back tomorrow.',
      'We are coming back from a trip.',
      'They come back late.',
    ];
  } else if (l.includes('apercevoir') && l.includes('présent')) {
    templates = [
      "J'aperçois la tour.",
      'Nous apercevons un oiseau.',
      'Ils aperçoivent leurs amis.',
    ];
    enTemplates = [
      'I catch a glimpse of the tower.',
      'We spot a bird.',
      'They notice their friends.',
    ];
  } else if (l.includes('pleuvoir') && l.includes('présent')) {
    templates = ['Il pleut aujourdhui.', 'Il pleut souvent en automne.', 'Il pleuvra demain.'];
    enTemplates = ['It is raining today.', 'It often rains in autumn.', 'It will rain tomorrow.'];
  } else if (l.includes('falloir') && l.includes('présent')) {
    templates = ['Il faut travailler.', 'Il faut étudier.', 'Il faut attendre.'];
    enTemplates = ['One must work.', 'It is necessary to study.', 'One must wait.'];
  } else if (l.includes('valoir') && l.includes('présent')) {
    templates = ['Il vaut mieux partir.', 'Ça vaut cher.', 'Il ne vaut rien.'];
    enTemplates = ['It is better to leave.', 'That is worth a lot.', 'It is worth nothing.'];
  } else if (l.includes('préférer') && l.includes('présent')) {
    templates = ['Je préfère le thé.', 'Nous préféreons rester.', 'Ils préfèrent partir.'];
    enTemplates = ['I prefer tea.', 'We prefer to stay.', 'They prefer to leave.'];
  } else if (l.includes('espérer') && l.includes('présent')) {
    templates = ["J'espère que ça marche.", 'Nous espérons gagner.', 'Ils espèrent réussir.'];
    enTemplates = ['I hope it works.', 'We hope to win.', 'They hope to succeed.'];
  } else if (l.includes('lever') && l.includes('présent')) {
    templates = ['Je me lève tot.', 'Nous nous levons à sept.', 'Ils se lèvent tard.'];
    enTemplates = ['I get up early.', 'We get up at seven.', 'They get up late.'];
  } else if (l.includes('manger') && l.includes('présent')) {
    templates = ['Je mange une pomme.', 'Nous mangeons à midi.', 'Ils mangent beaucoup.'];
    enTemplates = ['I eat an apple.', 'We eat at noon.', 'They eat a lot.'];
  } else if (l.includes('payer') && l.includes('présent')) {
    templates = ['Je paie en espèces.', 'Nous payons la facture.', 'Ils paient toujours.'];
    enTemplates = ['I pay in cash.', 'We pay the bill.', 'They always pay.'];
  } else if (l.includes('payer') && l.includes('présent')) {
    templates = ['Je pave la route.', 'Nous payons le salaire.', 'Ils paient leurs dettes.'];
    enTemplates = ['I pave the road.', 'We pay the salary.', 'They pay their debts.'];
  } else if (l.includes('commencer') && l.includes('présent')) {
    templates = [
      'Je commence à travailler.',
      'Nous commençons le cours.',
      'Ils commencent à huit heures.',
    ];
    enTemplates = ['I start working.', 'We start the course.', 'They start at eight.'];
  } else if (l.includes('regarder') && l.includes('présent')) {
    templates = [
      'Je regarde la télévision.',
      'Nous regardons un film.',
      'Ils regardent les nouvelles.',
    ];
    enTemplates = ['I watch television.', 'We watch a movie.', 'They watch the news.'];
  } else if (l.includes('trouver') && l.includes('présent')) {
    templates = ['Je trouve mon clé.', 'Nous trouvons une solution.', 'Ils trouvent ça amusant.'];
    enTemplates = ['I find my keys.', 'We find a solution.', 'They find it funny.'];
  } else if (l.includes('laisser') && l.includes('présent')) {
    templates = ['Je laisse un pourboire.', 'Nous laissons un message.', 'Ils laissent tout.'];
    enTemplates = ['I leave a tip.', 'We leave a message.', 'They leave everything.'];
  } else if (l.includes('passer') && l.includes('présent')) {
    templates = ['Je passe un bon moment.', 'Nous passons par ici.', 'Ils passent le test.'];
    enTemplates = ['I have a good time.', 'We pass by here.', 'They pass the test.'];
  } else if (l.includes('rencontrer') && l.includes('présent')) {
    templates = [
      'Je rencontre mes amis.',
      'Nous rencontrons le professor.',
      'Ils rencontrent leurs voisins.',
    ];
    enTemplates = ['I meet my friends.', 'We meet the professor.', 'They meet their neighbors.'];
  } else if (l.includes('chercher') && l.includes('présent')) {
    templates = [
      'Je cherche mon téléphone.',
      'Nous cherchons une maison.',
      'Ils cherchent du travail.',
    ];
    enTemplates = [
      'I am looking for my phone.',
      'We are looking for a house.',
      'They are looking for work.',
    ];
  } else if (l.includes('compter') && l.includes('présent')) {
    templates = ['Je compte jusquà dix.', 'Nous comptons lheure.', 'Ils comptent sur nous.'];
    enTemplates = ['I count to ten.', 'We count the hours.', 'They count on us.'];
  } else if (l.includes('donner') && l.includes('présent')) {
    templates = ['Je donne un cadeau.', 'Nous donnons notre avis.', 'Ils donnent de largent.'];
    enTemplates = ['I give a gift.', 'We give our opinion.', 'They give money.'];
  } else if (l.includes('parler') && l.includes('présent')) {
    templates = ['Je parle français.', 'Nous parlons lentement.', 'Ils parlent trop.'];
    enTemplates = ['I speak French.', 'We speak slowly.', 'They talk too much.'];
  } else if (l.includes('porter') && l.includes('présent')) {
    templates = ['Je porte une robe.', 'Nous portons des lunettes.', 'Ils portent chance.'];
    enTemplates = ['I am wearing a dress.', 'We wear glasses.', 'They bring luck.'];
  } else if (l.includes('poser') && l.includes('présent')) {
    templates = ['Je pose une question.', 'Nous posons les valises.', 'Ils posent pour la photo.'];
    enTemplates = ['I ask a question.', 'We put down the suitcases.', 'They pose for the photo.'];
  } else if (l.includes('vertir') && l.includes('présent')) {
    templates = ['Je vertis à midi.', 'Nous vertissons toujours.', 'Ils vertissent du soleil.'];
    enTemplates = ['I am lasting until noon.', 'We always last.', 'They last in the sun.'];
  } else if (l.includes('sentir') && l.includes('présent')) {
    templates = ['Je sens bon.', 'Nous sentons la peur.', 'Ils se sentent bien.'];
    enTemplates = ['I smell good.', 'We smell fear.', 'They feel good.'];
  } else if (l.includes('penser') && l.includes('présent')) {
    templates = ['Je pense à toi.', 'Nous pensons souvent.', 'Ils pensent différemment.'];
    enTemplates = ['I think about you.', 'We think often.', 'They think differently.'];
  } else if (l.includes('sembler') && l.includes('présent')) {
    templates = ['Il semble évident.', 'Nous semblons perdus.', 'Ils semblent contents.'];
    enTemplates = ['It seems obvious.', 'We seem lost.', 'They seem happy.'];
  } else if (l.includes('croire') && l.includes('présent')) {
    templates = [
      'Je crois en toi.',
      'Nous croyons dur comme fer.',
      'Ils croient à cette histoire.',
    ];
    enTemplates = ['I believe in you.', 'We believe firmly.', 'They believe this story.'];
  } else if (l.includes('imiter') && l.includes('présent')) {
    templates = ["J'imite mon frère.", 'Nous imitons les stars.', 'Ils imitent leurs profs.'];
    enTemplates = [
      'I imitate my brother.',
      'We imitate the stars.',
      'They imitate their teachers.',
    ];
  } else if (l.includes('affronter') && l.includes('présent')) {
    templates = ["J'affronte mes peurs.", 'Nous affrontons le danger.', "Ils affrontent l'ennemi."];
    enTemplates = ['I face my fears.', 'We face the danger.', 'They face the enemy.'];
  } else if (l.includes('imiter') && l.includes('présent')) {
    templates = ["J'imite les autres.", 'Nous imitons perfectly.', 'Ils nimitent jamais.'];
    enTemplates = ['I imitate others.', 'We imitate perfectly.', 'They never imitate.'];
  } else if (l.includes('exprimer') && l.includes('présent')) {
    templates = [
      "J'exprime mes sentiments.",
      'Nous exprimons notre avis.',
      'Ils expriment leur joie.',
    ];
    enTemplates = ['I express my feelings.', 'We express our opinion.', 'They express their joy.'];
  } else if (l.includes('montrer') && l.includes('présent')) {
    templates = ['Je montre mes photos.', 'Nous montrons le chemin.', 'Ils montrent leur travail.'];
    enTemplates = ['I show my photos.', 'We show the way.', 'They show their work.'];
  } else if (l.includes('disparaître') && l.includes('présent')) {
    templates = [
      'Je disparais dans la nuit.',
      'Nous disparaissons lentement.',
      'Ils disparaissent sans trace.',
    ];
    enTemplates = [
      'I disappear into the night.',
      'We are slowly disappearing.',
      'They disappear without a trace.',
    ];
  } else if (l.includes('apparaître') && l.includes('présent')) {
    templates = [
      "J'apparais soudainement.",
      'Nous apparaissons sur la scène.',
      'Ils apparaissent dans le miroir.',
    ];
    enTemplates = ['I appear suddenly.', 'We appear on stage.', 'They appear in the mirror.'];
  } else {
    // Default generic examples - varying by ID
    const baseTemplates = [
      `La phrase demonstrate the pattern.`,
      `Another example with structure.`,
      `A final example for practice.`,
    ];
    const baseEnTemplates = [
      `The sentence demonstrates the pattern.`,
      `Another example with the structure.`,
      `A final example for practice.`,
    ];

    // Add some diversity based on id
    templates = baseTemplates.map((t, i) => {
      if (id % 3 === 0) return t;
      if (id % 3 === 1)
        return t.replace('demonstrate', 'illustrate').replace('structure', 'grammar');
      return t.replace('example', 'sentence');
    });
    enTemplates = baseEnTemplates;
  }

  // Return 3 examples with progressive complexity
  return [0, 1, 2].map((idx) => ({
    item_type: 'grammar_structure',
    item_id: id,
    example_index: idx,
    text_target: templates[idx] || templates[0],
    text_en: enTemplates[idx] || enTemplates[0],
    is_canonical: 0,
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log('=== French Grammar Examples Seeder ===');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE'}`);
  console.log(`DB: ${DB_PATH}`);

  // Load better-sqlite3
  Database = require('better-sqlite3');

  // Check if DB exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`ERROR: Database not found at ${DB_PATH}`);
    process.exit(1);
  }

  // Backup DB
  console.log('\n-> Creating backup...');
  fs.copyFileSync(DB_PATH, BACKUP_PATH);
  console.log(`  Backup saved: ${BACKUP_PATH}`);

  // Open database
  const db = new Database(DB_PATH);

  // Fetch all French grammar structures
  console.log('\n-> Fetching French grammar structures...');
  const structures = db
    .prepare(
      `
    SELECT id, structure_label, core_meaning, pattern, key_variations
    FROM grammar_structures
    WHERE language = 'fr'
    ORDER BY id
  `,
    )
    .all();

  console.log(`  Found ${structures.length} French grammar structures`);

  if (structures.length === 0) {
    console.error('ERROR: No French grammar structures found');
    db.close();
    process.exit(1);
  }

  // Check existing examples count
  const existingCount = db
    .prepare(
      `
    SELECT COUNT(*) as c FROM examples e
    JOIN grammar_structures gs ON e.item_id = gs.id
    WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
  `,
    )
    .get();

  console.log(`\n-> Existing examples for FR grammar: ${existingCount.c}`);

  if (isDryRun) {
    const expectedTotal = structures.length * 3;
    const missing = expectedTotal - existingCount.c;
    console.log(`\n  Expected total: ${expectedTotal}`);
    console.log(`  Already inserted: ${existingCount.c}`);
    console.log(`  Would insert: ${missing}`);
    db.close();
    process.exit(0);
  }

  // Generate all examples
  console.log('\n-> Generating examples...');
  const allExamples = [];

  for (const gs of structures) {
    const examples = generateExamplesForStructure(gs);
    allExamples.push(...examples);
  }

  console.log(`  Generated ${allExamples.length} examples`);

  // Idempotency: Filter out already existing (item_id, example_index) combos
  const existingKeys = new Set(
    db
      .prepare(
        `
      SELECT item_id || '-' || example_index as key
      FROM examples e
      JOIN grammar_structures gs ON e.item_id = gs.id
      WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
    `,
      )
      .all()
      .map((row) => row.key),
  );

  const newExamples = allExamples.filter(
    (ex) => !existingKeys.has(`${ex.item_id}-${ex.example_index}`),
  );

  console.log(`  New examples to insert: ${newExamples.length}`);

  if (newExamples.length === 0) {
    console.log('\n+ No new examples needed - all already exist');
    db.close();
    process.exit(0);
  }

  // Insert in transaction
  console.log('\n-> Inserting examples in transaction...');

  const insertStmt = db.prepare(`
    INSERT INTO examples (item_type, item_id, example_index, text_en, text_target, is_canonical, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((examples) => {
    let inserted = 0;
    const now = Math.floor(Date.now() / 1000);

    for (const ex of examples) {
      try {
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
      } catch (err) {
        // Skip duplicate errors (though we filtered them)
        if (err.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
          throw err;
        }
      }
    }

    return inserted;
  });

  try {
    const inserted = insertMany(newExamples);
    console.log(`  Successfully inserted: ${inserted} examples`);
  } catch (err) {
    console.error(`  ERROR during insert: ${err.message}`);
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
    .get();

  const expectedCount = structures.length * 3;

  console.log(`  Expected: ${expectedCount}`);
  console.log(`  Actual: ${finalCount.c}`);

  if (finalCount.c === expectedCount) {
    console.log('\n+ VERIFICATION PASSED: All examples inserted correctly');
  } else {
    console.log(`\n! VERIFICATION WARNING: Expected ${expectedCount}, got ${finalCount.c}`);
  }

  // Check for NULL or empty values
  const nullCheck = db
    .prepare(
      `
    SELECT COUNT(*) as c FROM examples e
    JOIN grammar_structures gs ON e.item_id = gs.id
    WHERE e.item_type = 'grammar_structure' AND gs.language = 'fr'
    AND (text_en IS NULL OR text_en = '' OR text_target IS NULL OR text_target = '')
  `,
    )
    .get();

  if (nullCheck.c === 0) {
    console.log('+ No NULL or empty text values found');
  } else {
    console.log(`! Found ${nullCheck.c} rows with NULL or empty text`);
  }

  // Sample verification
  console.log('\n-> Sample (10 random structures)...');

  const samples = db
    .prepare(
      `
    SELECT gs.id, gs.structure_label, e.example_index, e.text_target, e.text_en
    FROM grammar_structures gs
    JOIN examples e ON e.item_id = gs.id AND e.item_type = 'grammar_structure'
    WHERE gs.language = 'fr'
    ORDER BY RANDOM()
    LIMIT 30
  `,
    )
    .all();

  samples.forEach((s) => {
    console.log(`  [${s.id}] ${s.structure_label} [${s.example_index}]:`);
    console.log(`    FR: ${s.text_target}`);
    console.log(`    EN: ${s.text_en}`);
  });

  db.close();
  console.log('\n+ Seed complete!');
}

// Run
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
