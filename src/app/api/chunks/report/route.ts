import { NextResponse } from 'next/server';
import { createChunkReport, getChunkById } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { parseJson } from '@/lib/validation/parse';
import { chunkReportSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/*
! POST /api/chunks/report — submit a quality issue about a chunk.
! Body validated via chunkReportSchema (Zod).
! Per-user rate limit of 5/min keeps the table clean of spam.
*/

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = enforceRateLimit(request, userId, RATE_LIMITS.chunkReport);
  if (limited) return limited;

  const parsed = await parseJson(request, chunkReportSchema);
  if (!parsed.ok) return parsed.error;
  const { chunkId, reason } = parsed.data;

  if (!getChunkById(chunkId)) {
    return NextResponse.json({ error: 'Chunk not found' }, { status: 404 });
  }

  try {
    createChunkReport(userId, chunkId, reason);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to create chunk report', { error, userId, chunkId });
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
