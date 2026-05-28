import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { saveFeynmanExplanation, getChunkProgress, updateChunkProgress } from '@/lib/db/sqlite';
import { calculateSM2 } from '@/lib/spaced-repetition/sm2';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- POST /api/feynman/submit - Saves user's Feynman explanation AND updates SM-2
- Validates chunkId, explanation, and quality (1-3)
- Quality: 1 = needs work, 2 = good, 3 = perfect
- Maps to SM-2 quality: 1→2, 2→3, 3→5
- Requires authentication via session cookie
*/

interface FeynmanSubmitRequest {
  chunkId: number;
  explanation: string;
  quality: number;
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromCookie();

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: FeynmanSubmitRequest = await request.json();
    const { chunkId, explanation, quality } = body;

    if (!chunkId || typeof chunkId !== 'number') {
      return NextResponse.json({ error: 'Invalid chunkId' }, { status: 400 });
    }

    if (!explanation || typeof explanation !== 'string' || explanation.trim().length === 0) {
      return NextResponse.json({ error: 'Explanation is required' }, { status: 400 });
    }

    if (!quality || quality < 1 || quality > 3 || typeof quality !== 'number') {
      return NextResponse.json(
        { error: 'Quality must be a number between 1 and 3' },
        { status: 400 },
      );
    }

    // Map feynman quality (1-3) to SM-2 quality (0-5)
    const sm2Quality = quality === 1 ? 2 : quality === 2 ? 3 : 5;

    const saved = saveFeynmanExplanation(userId, chunkId, explanation.trim(), quality);

    // Also update SM-2 progress
    const existingProgress = getChunkProgress(userId, chunkId);
    const currentRepetitions = existingProgress?.repetitions || 0;
    const currentEaseFactor = existingProgress?.ease_factor || 2.5;
    const currentInterval = existingProgress?.interval || 0;

    const sm2Result = calculateSM2({
      quality: sm2Quality,
      repetitions: currentRepetitions,
      easeFactor: currentEaseFactor,
      interval: currentInterval,
    });

    const updatedProgress = updateChunkProgress(userId, chunkId, sm2Quality, sm2Result);

    return NextResponse.json({
      success: true,
      saved: true,
      id: saved.id,
      sm2: {
        repetitions: sm2Result.repetitions,
        interval: sm2Result.interval,
        nextReview: sm2Result.nextReview.toISOString(),
        isMastered: sm2Result.repetitions >= 3,
      },
    });
  } catch (error) {
    console.error('Error saving Feynman explanation:', error);
    return NextResponse.json({ error: 'Failed to save explanation' }, { status: 500 });
  }
}
