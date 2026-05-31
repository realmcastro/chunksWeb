import { NextResponse } from 'next/server';
import { calculateSM2 } from '@/lib/spaced-repetition/sm2';
import { getChunkProgress, updateChunkProgress, recordStudySession, getChunkById } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { parseJson } from '@/lib/validation/parse';
import { reviewSubmitSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { emit } from '@/lib/events/eventBus';
import '@/lib/events/subscribers';

/*
! POST /api/review/submit — quality rating → SM-2 update.
! Mastery transition (wasMastered → isNowMastered) drives the
! `mastered` increment on study_sessions for the day.
*/

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = enforceRateLimit(request, userId, RATE_LIMITS.reviewSubmit);
  if (limited) return limited;

  const parsed = await parseJson(request, reviewSubmitSchema);
  if (!parsed.ok) return parsed.error;
  const { chunkId, quality } = parsed.data;

  try {
    const existingProgress = getChunkProgress(userId, chunkId);
    const wasMastered = existingProgress ? existingProgress.repetitions >= 3 : false;

    const sm2Result = calculateSM2({
      quality,
      repetitions: existingProgress?.repetitions ?? 0,
      easeFactor: existingProgress?.ease_factor ?? 2.5,
      interval: existingProgress?.interval ?? 0,
    });

    updateChunkProgress(userId, chunkId, quality, sm2Result);

    const isNowMastered = sm2Result.repetitions >= 3;
    const becameMastered = !wasMastered && isNowMastered;

    recordStudySession(userId, 1, becameMastered ? 1 : 0);

    const chunk = getChunkById(chunkId);
    const domainId = chunk?.domain_id ?? 1;
    const today = new Date().toISOString().split('T')[0];

    emit('study.chunk.reviewed', {
      userId,
      chunkId,
      quality,
      domainId,
      durationMs: 0,
    });

    emit('study.session.completed', {
      userId,
      domainId,
      chunksReviewed: 1,
      chunksMastered: becameMastered ? 1 : 0,
      durationMs: 0,
      sessionDate: today,
    });

    return NextResponse.json({
      success: true,
      nextReview: sm2Result.nextReview.toISOString(),
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      easeFactor: sm2Result.easeFactor,
      isMastered: isNowMastered,
    });
  } catch (error) {
    logger.error('Error submitting review', { error, userId, chunkId });
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
