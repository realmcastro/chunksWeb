import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { getAllFeynmanExplanations } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const rows = getAllFeynmanExplanations(userId);

    // Group by chunk_id, most recent explanation per chunk first
    const byChunk = new Map<number, typeof rows>();
    for (const row of rows) {
      if (!byChunk.has(row.chunk_id)) byChunk.set(row.chunk_id, []);
      byChunk.get(row.chunk_id)!.push(row);
    }

    const grouped = Array.from(byChunk.values()).map((entries) => ({
      chunk_id: entries[0].chunk_id,
      chunk_text: entries[0].chunk_text,
      meaning: entries[0].meaning,
      explanations: entries.map((e) => ({
        id: e.id,
        explanation: e.explanation,
        quality: e.quality,
        created_at: e.created_at,
      })),
    }));

    return NextResponse.json({ grouped, total: rows.length });
  } catch (error) {
    console.error('Error fetching feynman history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
