import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import {
  recordStudySession,
  getCurrentStreak,
  getMasteredCount,
  recordSessionActivity,
} from '@/lib/db/sqlite';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- POST /api/session/end - Record study session and update streak
- Request body: { mode: string, chunksReviewed: number, chunksMastered: number, chunkIds?: number[] }
- Records activity in study_sessions table AND session_activities table
- Stores chunk IDs for later retrieval in review/feynman modes
- Requires authentication via session cookie
*/

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromCookie();

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { mode, chunksReviewed = 0, chunksMastered = 0, chunkIds = [] } = body;

    if (!mode || typeof mode !== 'string') {
      return NextResponse.json({ error: 'mode is required' }, { status: 400 });
    }

    recordStudySession(userId, chunksReviewed, chunksMastered);

    // Store chunk IDs for later retrieval
    if (Array.isArray(chunkIds) && chunkIds.length > 0) {
      recordSessionActivity(userId, mode, chunkIds);
    }

    const streak = getCurrentStreak(userId);
    const totalMastered = getMasteredCount(userId);

    return NextResponse.json({
      success: true,
      streak,
      totalMastered,
      chunksReviewed,
      chunksMastered,
      sessionChunkCount: Array.isArray(chunkIds) ? chunkIds.length : 0,
    });
  } catch (error) {
    console.error('Error recording session:', error);
    return NextResponse.json({ error: 'Failed to record session' }, { status: 500 });
  }
}
