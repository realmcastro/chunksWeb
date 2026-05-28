import { NextResponse } from 'next/server';
import { db } from '@/lib/db/sqlite';

export interface VocabWord {
  id: number;
  category: string;
  subcategory: string;
  word: string;
  phonetic: string;
  part_of_speech: string;
  cefr_level: string;
  frequency_rank: number;
  article: string;
  plural_form: string;
  primary_meaning: string;
  secondary_meaning: string;
  common_collocations: string;
  synonyms: string;
  image_search_query: string;
  image_context: string;
  image_tags: string;
  example_1: string;
  example_1_translation: string;
  example_2: string;
  example_2_translation: string;
  example_3: string;
  example_3_translation: string;
  pronunciation_tips: string;
  memory_hook: string;
  related_words: string;
  common_mistakes: string;
  learning_priority: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  const cefr = searchParams.get('cefr');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const random = searchParams.get('random') === 'true';
  const gameCount = parseInt(searchParams.get('gameCount') || '0');
  const language = searchParams.get('language');

  let query = 'SELECT * FROM vocabulary_words WHERE 1=1';
  const params: (string | number)[] = [];

  if (language) {
    query += ' AND language = ?';
    params.push(language);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (subcategory) {
    query += ' AND subcategory = ?';
    params.push(subcategory);
  }
  if (cefr) {
    query += ' AND cefr_level = ?';
    params.push(cefr);
  }

  if (gameCount > 0) {
    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(gameCount);
  } else if (random) {
    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(limit);
  } else {
    query += ' ORDER BY frequency_rank ASC, id ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  const words = db.prepare(query).all(...params) as VocabWord[];

  const countQuery =
    'SELECT COUNT(*) as count FROM vocabulary_words WHERE 1=1' +
    (language ? ' AND language = ?' : '') +
    (category ? ' AND category = ?' : '') +
    (subcategory ? ' AND subcategory = ?' : '') +
    (cefr ? ' AND cefr_level = ?' : '');
  const countParams = [language, category, subcategory, cefr].filter(Boolean) as string[];
  const { count } = db.prepare(countQuery).get(...countParams) as { count: number };

  const categoriesQuery = language
    ? 'SELECT DISTINCT category, subcategory FROM vocabulary_words WHERE language = ? ORDER BY category, subcategory'
    : 'SELECT DISTINCT category, subcategory FROM vocabulary_words ORDER BY category, subcategory';
  const categories = language
    ? (db.prepare(categoriesQuery).all(language) as { category: string; subcategory: string }[])
    : (db.prepare(categoriesQuery).all() as { category: string; subcategory: string }[]);

  const cefrLevelsQuery = language
    ? 'SELECT cefr_level, COUNT(*) as count FROM vocabulary_words WHERE language = ? GROUP BY cefr_level ORDER BY cefr_level'
    : 'SELECT cefr_level, COUNT(*) as count FROM vocabulary_words GROUP BY cefr_level ORDER BY cefr_level';
  const cefrLevels = language
    ? (db.prepare(cefrLevelsQuery).all(language) as { cefr_level: string; count: number }[])
    : (db.prepare(cefrLevelsQuery).all() as { cefr_level: string; count: number }[]);

  return NextResponse.json({ words, total: count, categories, cefrLevels });
}
