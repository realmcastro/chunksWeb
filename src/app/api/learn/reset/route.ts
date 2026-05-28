import { NextResponse } from 'next/server';
import { resetChunkProgress, isChunkInStudy } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

/*
! POST /api/learn/reset — keeps the chunk in the study queue but resets SM-2 state.
! Use when the user wants to re-learn a chunk without removing it.
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
  if (!isChunkInStudy(userId, chunkId)) {
    return NextResponse.json({ error: 'Chunk is not in study queue' }, { status: 400 });
  }

  try {
    resetChunkProgress(userId, chunkId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to reset chunk progress', { error, userId, chunkId });
    return NextResponse.json({ error: 'Failed to reset progress' }, { status: 500 });
  }
}
