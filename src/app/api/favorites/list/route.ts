import { NextResponse } from 'next/server';
import { getFavoritesForUser, getFavoritesCount } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

/*
? GET /api/favorites/list?limit=&offset=&language= — paginated favorites for current user.
*/
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
  const language = searchParams.get('language') || undefined;

  try {
    const chunks = getFavoritesForUser(userId, limit, offset, language);
    const totalCount = getFavoritesCount(userId, language);
    return NextResponse.json({ chunks, totalCount });
  } catch (error) {
    logger.error('Failed to list favorites', { error, userId });
    return NextResponse.json({ error: 'Failed to list favorites' }, { status: 500 });
  }
}
