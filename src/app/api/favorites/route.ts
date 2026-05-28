import { NextResponse } from 'next/server';
import { toggleFavoriteUseCase } from '@/features/favorites';
import { getUserId } from '@/lib/auth/session';
import { parseJson } from '@/lib/validation/parse';
import { favoriteSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/*
! POST = add favorite, DELETE = remove favorite.
! Body validated via favoriteSchema (Zod). Auth required.
*/

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = enforceRateLimit(request, userId, RATE_LIMITS.favorites);
  if (limited) return limited;

  const parsed = await parseJson(request, favoriteSchema);
  if (!parsed.ok) return parsed.error;
  const { chunkId } = parsed.data;

  try {
    const result = toggleFavoriteUseCase(userId, chunkId, true);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error('Error adding favorite', { userId, chunkId, error });
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = enforceRateLimit(request, userId, RATE_LIMITS.favorites);
  if (limited) return limited;

  const parsed = await parseJson(request, favoriteSchema);
  if (!parsed.ok) return parsed.error;
  const { chunkId } = parsed.data;

  try {
    const result = toggleFavoriteUseCase(userId, chunkId, false);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error('Error removing favorite', { userId, chunkId, error });
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
