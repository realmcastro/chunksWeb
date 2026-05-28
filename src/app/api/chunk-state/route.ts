import { NextResponse } from 'next/server';
import { isFavorite, isChunkInStudy } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';

/*
? GET /api/chunk-state?chunkId=N — combined favorite + in-study check for a single chunk.
? Used by chunk detail page to render Heart / "Add to study" button state.
*/
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('chunkId');
  const chunkId = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(chunkId) || chunkId <= 0) {
    return NextResponse.json({ error: 'Valid chunkId is required' }, { status: 400 });
  }

  try {
    return NextResponse.json({
      favorite: isFavorite(userId, chunkId),
      inStudy: isChunkInStudy(userId, chunkId),
    });
  } catch (error) {
    console.error('Error fetching chunk state:', { userId, chunkId, error });
    return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
  }
}
