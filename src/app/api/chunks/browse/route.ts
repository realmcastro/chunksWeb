import { NextResponse } from 'next/server';
import {
  getChunks,
  getChunkCount,
  getChunksByCategory,
  getChunkCountByCategory,
  searchChunks,
  getChunksByPriority,
  getChunkCountByPriority,
  type Chunk,
} from '@/lib/db/sqlite';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const categoryId = searchParams.get('category');
  const searchQuery = searchParams.get('search') || '';
  const acquisitionPriority = searchParams.get('priority') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const language = searchParams.get('language') || undefined;

  let chunks: Chunk[] = [];
  let totalCount = 0;

  /*
  ! totalCount deve ser calculado com o mesmo filtro de language dos chunks
  ? para que a paginação reflita o total real de itens visíveis no idioma selecionado.
  */
  if (searchQuery) {
    chunks = searchChunks(searchQuery, limit, offset, language);
    totalCount = chunks.length;
  } else if (categoryId) {
    chunks = getChunksByCategory(parseInt(categoryId), limit, offset, language);
    totalCount = getChunkCountByCategory(parseInt(categoryId), language);
  } else if (acquisitionPriority) {
    chunks = getChunksByPriority(acquisitionPriority, limit, offset, language);
    totalCount = getChunkCountByPriority(acquisitionPriority);
  } else {
    chunks = getChunks(limit, offset, language);
    totalCount = getChunkCount(language);
  }

  return NextResponse.json({ chunks, totalCount });
}
