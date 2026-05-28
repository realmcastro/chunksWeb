import { NextResponse } from 'next/server';
import {
  getGrammarStructures,
  getGrammarStructuresByCategory,
  getGrammarStructureCount,
  getGrammarStructureCountByCategory,
  searchGrammarStructures,
  type GrammarStructure,
} from '@/lib/db/sqlite';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const categoryId = searchParams.get('category');
  const searchQuery = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const language = searchParams.get('language') || undefined;

  let structures: GrammarStructure[] = [];
  let totalCount = 0;

  if (searchQuery) {
    structures = searchGrammarStructures(searchQuery, limit, offset);
    totalCount = structures.length;
  } else if (categoryId) {
    structures = getGrammarStructuresByCategory(parseInt(categoryId), limit, offset, language);
    totalCount = getGrammarStructureCountByCategory(parseInt(categoryId));
  } else {
    structures = getGrammarStructures(limit, offset, language);
    totalCount = getGrammarStructureCount();
  }

  return NextResponse.json({ structures, totalCount });
}
