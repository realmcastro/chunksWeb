import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { parseSearchQuery } from '@/lib/search/queryParser';
import { search } from '@/lib/search/ranker';

const SearchParamsSchema = z.object({
  q: z.string().min(1).max(256),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/*
! GET /api/search?q=redis&limit=20&offset=0
! Supports DSL filters inline: q=redis+type:chunk+domain:backend+period:last30d
*/
export async function GET(request: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = SearchParamsSchema.safeParse({
    q: searchParams.get('q'),
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { q, limit, offset } = parsed.data;
  const query = parseSearchQuery(q);

  try {
    const results = search(query, userId, limit, offset);
    return NextResponse.json({
      query: q,
      parsed: {
        freeText: query.freeText,
        filters: query.filters,
      },
      results,
      total: results.length,
    });
  } catch (error) {
    console.error('[search] query failed', { error, q, userId });
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
