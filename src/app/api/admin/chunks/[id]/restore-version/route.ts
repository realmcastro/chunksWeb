import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { restoreChunkVersion, getChunkById } from '@/lib/db/sqlite';

/*
! Admin-only route. Currently guards by authentication only.
? Restores chunk_text and meaning from a saved version entry.
? The restore triggers chunks_version_bu — current values are saved before overwrite.
*/
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const chunkId = parseInt(id);
  if (isNaN(chunkId)) return NextResponse.json({ error: 'Invalid chunk id' }, { status: 400 });

  const chunk = getChunkById(chunkId);
  if (!chunk) return NextResponse.json({ error: 'Chunk not found' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const versionId = (body as Record<string, unknown>)?.version_id;
  if (typeof versionId !== 'number' || !Number.isInteger(versionId)) {
    return NextResponse.json({ error: 'version_id must be an integer' }, { status: 400 });
  }

  const ok = restoreChunkVersion(chunkId, versionId);
  if (!ok) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
