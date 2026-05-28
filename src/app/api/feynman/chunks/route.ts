import { NextResponse } from 'next/server';
import { getSmartFeynmanChunks, getExamplesForChunk, getCategoryById } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const language = searchParams.get('language') || undefined;

    const chunks = getSmartFeynmanChunks(userId, limit, language);

    const chunksWithDetails = chunks.map((chunk) => {
      const examples = getExamplesForChunk(chunk.id);
      const category = getCategoryById(chunk.category_id);

      return {
        id: chunk.id.toString(),
        chunk: chunk.chunk_text,
        meaning: chunk.meaning,
        // note is kept for legacy use; lastExplanation is the prior Feynman answer
        explanation: chunk.note || null,
        lastExplanation: chunk.last_feynman_explanation
          ? {
              text: chunk.last_feynman_explanation,
              quality: chunk.last_feynman_quality,
              createdAt: chunk.last_feynman_at,
            }
          : null,
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
    console.error('Error fetching feynman chunks:', error);
    return NextResponse.json({ error: 'Failed to fetch chunks' }, { status: 500 });
  }
}
