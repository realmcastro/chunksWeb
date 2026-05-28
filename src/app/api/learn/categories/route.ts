import { NextResponse } from 'next/server';
import { getCategoriesWithProgress } from '@/lib/db/sqlite';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- GET /api/learn/categories - Returns all categories with progress info
- Shows total chunks, learned chunks, mastered chunks per category
- Accepts optional ?language= param to scope counts to a single language
*/
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || undefined;

    const categories = getCategoriesWithProgress(language);

    return NextResponse.json({
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('Error fetching categories with progress:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
