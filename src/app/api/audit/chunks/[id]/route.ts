import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { getChunkWithExamples, updateChunk, upsertChunkExamples } from '@/lib/db/audit';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const data = getChunkWithExamples(Number(id));
  if (!data.chunk) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { examples, ...fields } = body as { examples?: unknown; [k: string]: unknown };

  const updated = updateChunk(numId, fields as never);

  if (Array.isArray(examples)) {
    upsertChunkExamples(
      numId,
      (examples as { text_en: string; text_target?: string; index: number }[]),
    );
  }

  return NextResponse.json({ success: updated });
}
