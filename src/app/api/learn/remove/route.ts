import { NextResponse } from 'next/server';
import { removeChunkFromStudy } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

/*
! POST /api/learn/remove — destroys SM-2 progress for the chunk.
! Caller must confirm with the user (lost progress is unrecoverable).
*/
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: { chunkId?: unknown };
  try {
    body = (await request.json()) as { chunkId?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const raw = body.chunkId;
  const chunkId =
    typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(chunkId) || chunkId <= 0) {
    return NextResponse.json({ error: 'Valid chunkId is required' }, { status: 400 });
  }

  try {
    removeChunkFromStudy(userId, chunkId);
    return NextResponse.json({ success: true, inStudy: false });
  } catch (error) {
    logger.error('Failed to remove chunk from study', { error, userId, chunkId });
    return NextResponse.json({ error: 'Failed to remove from study' }, { status: 500 });
  }
}
