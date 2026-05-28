import { NextResponse } from 'next/server';
import {
  getErroredChunksForUser,
  getExamplesForChunk,
  getCategoryById,
} from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

/*
? GET /api/review/errored — chunks where the last review reset SM-2 reps to 0.
? Useful for an "review my mistakes" mode. Same response shape as /api/chunks/random
? so the existing ReviewSession component can consume it without changes.
*/
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10) || 10, 50);
  const language = searchParams.get('language') || undefined;

  try {
    const chunks = getErroredChunksForUser(userId, limit, language);
    const payload = chunks.map((chunk) => {
      const examples = getExamplesForChunk(chunk.id);
      const category = getCategoryById(chunk.category_id);
      return {
        id: chunk.id.toString(),
        chunk: chunk.chunk_text,
        meaning: chunk.meaning,
        note: chunk.note ?? null,
        examples: examples.map((ex) => ({
          id: ex.id.toString(),
          sentence: ex.text_en,
          translation: ex.text_target || undefined,
        })),
        category: {
          id: category?.id.toString() ?? '0',
          name: category?.name ?? 'Unknown',
          level: category?.type ?? 'foundation',
          color: category?.color_hex ?? '#607d8b',
        },
      };
    });
    return NextResponse.json({ chunks: payload, count: payload.length });
  } catch (error) {
    logger.error('Failed to fetch errored chunks', { error, userId });
    return NextResponse.json({ error: 'Failed to fetch errored chunks' }, { status: 500 });
  }
}
