import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { getQuickPracticeChunks, getExamplesForChunk, getCategoryById } from '@/lib/db/sqlite';

/*
! userId deve ser obtido do cookie de sessão — chamar sem ele fazia userId = limit (bug silencioso).
? Descrição técnica relevante que não seja óbvia pelo nome.

- GET /api/quick/due - Returns up to 10 chunks for quick practice
- Same as regular review but limited to 10 chunks
- Requires authentication via session cookie
- Accepts optional ?language= to filter by learning language
*/

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const language = searchParams.get('language') || undefined;

    const chunks = getQuickPracticeChunks(userId, limit, language);

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
    console.error('Error fetching quick practice chunks:', error);
    return NextResponse.json({ error: 'Failed to fetch quick practice chunks' }, { status: 500 });
  }
}
