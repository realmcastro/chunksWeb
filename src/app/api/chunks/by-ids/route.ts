import { NextResponse } from 'next/server';
import { getChunksByIds, getExamplesForChunk, getCategoryById } from '@/lib/db/sqlite';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- GET /api/chunks/by-ids - Returns chunks by ID array
- Query param: ids=1,2,3 (comma-separated list of chunk IDs)
- Includes examples and category info for display
*/
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: 'ids parameter is required' }, { status: 400 });
    }

    const chunkIds = idsParam
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id) && id > 0);

    if (chunkIds.length === 0) {
      return NextResponse.json({ error: 'Valid ids are required' }, { status: 400 });
    }

    const chunks = getChunksByIds(chunkIds);

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
    console.error('Error fetching chunks by ids:', error);
    return NextResponse.json({ error: 'Failed to fetch chunks' }, { status: 500 });
  }
}
