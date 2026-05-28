import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { getDueChunks, getExamplesForChunk, getCategoryById } from '@/lib/db/sqlite';

/*
! Invariantes, contratos, pré-condições e decisões críticas.
? Descrição técnica relevante que não seja óbvia pelo nome.

- GET /api/review/due - Returns chunks due for review today
- Includes examples and category info for each chunk
- Limit is configurable via query param (default 20)
- Requires authentication via session cookie
*/

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromCookie();

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const language = searchParams.get('language') || undefined;

    const chunks = getDueChunks(userId, limit, language);

    const chunksWithDetails = chunks.map((chunk) => {
      const examples = getExamplesForChunk(chunk.id);
      const category = getCategoryById(chunk.category_id);

      return {
        id: chunk.id.toString(),
        chunk: chunk.chunk_text,
        meaning: chunk.meaning,
        examples: examples.map((ex) => ({
          id: ex.id.toString(),
          sentence: ex.text_en,
          translation: ex.text_target || undefined,
        })),
        category: {
          id: category?.id.toString() || '0',
          name: category?.name || 'Unknown',
          level: category?.type || 'foundation',
        },
      };
    });

    return NextResponse.json({
      chunks: chunksWithDetails,
      count: chunksWithDetails.length,
    });
  } catch (error) {
    console.error('Error fetching due chunks:', error);
    return NextResponse.json({ error: 'Failed to fetch due chunks' }, { status: 500 });
  }
}
