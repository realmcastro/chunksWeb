import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { getUserLearningLanguage, setUserLearningLanguage } from '@/lib/db/sqlite';

/*
! Requer autenticação via cookie de sessão.
! Valores aceitos: 'en' | 'pt' | 'es' | 'fr' — rejeita qualquer outro.
? GET retorna a linguagem de estudo atual do usuário.
? POST persiste a nova linguagem de estudo no banco.
*/

const VALID_LANGUAGES = new Set(['en', 'pt', 'es', 'fr']);

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const language = getUserLearningLanguage(userId);
    return NextResponse.json({ language });
  } catch (error) {
    console.error('Error fetching learning language:', error);
    return NextResponse.json({ error: 'Failed to fetch learning language' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { language } = body;

    if (!language || !VALID_LANGUAGES.has(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    setUserLearningLanguage(userId, language);
    return NextResponse.json({ success: true, language });
  } catch (error) {
    console.error('Error saving learning language:', error);
    return NextResponse.json({ error: 'Failed to save learning language' }, { status: 500 });
  }
}
