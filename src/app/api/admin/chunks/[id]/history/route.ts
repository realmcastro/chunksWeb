import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { getChunkVersionHistory } from '@/lib/db/sqlite';

/*
! Admin-only route. Currently guards by authentication only.
? Future: add role check when RBAC is implemented.
*/
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const chunkId = parseInt(id);
  if (isNaN(chunkId)) return NextResponse.json({ error: 'Invalid chunk id' }, { status: 400 });

  const versions = getChunkVersionHistory(chunkId);
  return NextResponse.json({ versions });
}
