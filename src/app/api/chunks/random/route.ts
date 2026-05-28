import { NextResponse } from 'next/server';
import {
  getRandomChunks,
  getExamplesForChunk,
  getCategoryById,
  getRandomFavoriteIds,
  getChunkById,
  type Chunk,
} from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

/*
- GET /api/chunks/random
- Params:
-   categoryId  — restrict to chunks in a category (rejects grammar categories)
-   limit       — number of chunks (default 10)
-   language    — content language filter
-   source      — 'favorites' to draw only from the user's favorites (auth required)
- Returns: { chunks: [...], count } or { error: 'grammar_category' | 'no_favorites' }
*/
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const language = searchParams.get('language') || undefined;
    const source = searchParams.get('source');

    if (categoryId) {
      const category = getCategoryById(parseInt(categoryId, 10));
      if (category && category.type !== 'chunk') {
        return NextResponse.json({
          error: 'grammar_category',
          message: `Category "${category.name}" is a grammar structure category. Please use /grammar?category=${categoryId} instead.`,
          chunks: [],
          count: 0,
        });
      }
    }

    let chunks: Chunk[];
    if (source === 'favorites') {
      const userId = await getUserId();
      if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      const ids = getRandomFavoriteIds(userId, limit, language);
      if (ids.length === 0) {
        return NextResponse.json({ error: 'no_favorites', chunks: [], count: 0 });
      }
      chunks = ids
        .map((id) => getChunkById(id))
        .filter((c): c is Chunk => c !== null && c !== undefined);
    } else {
      chunks = getRandomChunks(
        categoryId ? parseInt(categoryId, 10) : undefined,
        limit,
        language,
      );
    }

    const chunksWithDetails = chunks.map((chunk) => {
      const examples = getExamplesForChunk(chunk.id);
      const category = getCategoryById(chunk.category_id);

      return {
        id: chunk.id.toString(),
        chunk: chunk.chunk_text,
        meaning: chunk.meaning,
        note: chunk.note || null,
        examples: examples.map((ex) => ({
          id: ex.id.toString(),
          sentence: ex.text_en,
          translation: ex.text_target || undefined,
        })),
        category: {
          id: category?.id.toString() || '0',
          name: category?.name || 'Unknown',
          level: category?.type || 'foundation',
          color: category?.color_hex || '#607d8b',
        },
      };
    });

    return NextResponse.json({
      chunks: chunksWithDetails,
      count: chunksWithDetails.length,
    });
  } catch (error) {
    logger.error('Error fetching random chunks', { error });
    return NextResponse.json({ error: 'Failed to fetch random chunks' }, { status: 500 });
  }
}
