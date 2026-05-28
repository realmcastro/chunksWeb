import { NextResponse } from 'next/server';
import { getProgressStats, getStartedChunksCount } from '@/lib/db/sqlite';
import { cookies } from 'next/headers';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- GET /api/progress/stats - Returns progress statistics for dashboard
- Extracts user from session cookie
- Returns per-user progress stats
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

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();

    if (!userId) {
      // For unauthenticated users, return empty stats
      return NextResponse.json({
        totalChunks: 0,
        categories: 0,
        mastered: 0,
        dueToday: 0,
        streak: 0,
        categoryProgress: [],
        startedChunks: 0,
      });
    }

    const stats = getProgressStats(userId);
    const startedChunks = getStartedChunksCount(userId);

    return NextResponse.json({
      ...stats,
      startedChunks,
    });
  } catch (error) {
    console.error('Error fetching progress stats:', error);
    return NextResponse.json({ error: 'Failed to fetch progress stats' }, { status: 500 });
  }
}
