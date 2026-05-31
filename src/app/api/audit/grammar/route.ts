import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { listGrammar } from '@/lib/db/audit';

export async function GET(request: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const lang = searchParams.get('lang') ?? 'all';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));

  const result = listGrammar(q, lang, page);
  return NextResponse.json(result);
}
