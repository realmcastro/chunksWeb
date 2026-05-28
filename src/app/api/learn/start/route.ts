import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { startChunkProgress } from '@/lib/db/sqlite';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- POST /api/learn/start - Initialize chunk progress when user starts learning
- Request body: { chunkIds: number[] }
- Creates user_progress entry with repetitions=0 for each chunk
- Requires authentication via session cookie
*/

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromCookie();

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { chunkIds } = body;

    if (!chunkIds || !Array.isArray(chunkIds) || chunkIds.length === 0) {
      return NextResponse.json({ error: 'chunkIds array is required' }, { status: 400 });
    }

    const validChunkIds = chunkIds.filter((id) => typeof id === 'number' && id > 0);

    if (validChunkIds.length === 0) {
      return NextResponse.json({ error: 'Valid chunkIds are required' }, { status: 400 });
    }

    startChunkProgress(userId, validChunkIds);

    return NextResponse.json({
      success: true,
      started: validChunkIds.length,
    });
  } catch (error) {
    console.error('Error starting chunk progress:', error);
    return NextResponse.json({ error: 'Failed to start chunk progress' }, { status: 500 });
  }
}
