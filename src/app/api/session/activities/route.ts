import { NextResponse } from 'next/server';
import { getPreviousSessionChunkIds, getRecentSessionActivities } from '@/lib/db/sqlite';
import { cookies } from 'next/headers';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- GET /api/session/activities - Get chunk IDs from previous sessions
- Query params: mode (required), recent (optional, default false)
- If mode=random and recent=true, returns chunk IDs from most recent random session
- Used by review and feynman modes to get previously studied chunks
*/

async function getUserIdFromCookie(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    return session.userId || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromCookie();

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const recent = searchParams.get('recent') === 'true';

    if (!mode) {
      return NextResponse.json({ error: 'mode parameter is required' }, { status: 400 });
    }

    if (recent) {
      // Get chunk IDs from most recent session
      const chunkIds = getPreviousSessionChunkIds(userId, mode);
      return NextResponse.json({
        mode,
        chunkIds,
        count: chunkIds.length,
      });
    }

    // Get recent session activities
    const sessions = getRecentSessionActivities(userId, 10);
    const modeSessions = sessions.filter((s) => s.mode === mode);

    return NextResponse.json({
      mode,
      sessions: modeSessions.map((s) => ({
        date: s.session_date,
        chunkIds: JSON.parse(s.chunk_ids),
        createdAt: s.created_at,
      })),
      count: modeSessions.length,
    });
  } catch (error) {
    console.error('Error fetching session activities:', error);
    return NextResponse.json({ error: 'Failed to fetch session activities' }, { status: 500 });
  }
}
