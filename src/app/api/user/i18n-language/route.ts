import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { getUserI18nLanguage, setUserI18nLanguage } from '@/lib/db/sqlite';

/*
! Requer autenticação via cookie de sessão.
! Valores aceitos: 'en' | 'pt' | 'es' | 'fr' — rejeita qualquer outro.
? GET retorna a linguagem I18n atual do usuário.
? POST persiste a nova linguagem I18n no banco.
*/

const VALID_LANGUAGES = new Set(['en', 'pt', 'es', 'fr']);

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const language = getUserI18nLanguage(userId);
    return NextResponse.json({ language });
  } catch (error) {
    console.error('Error fetching I18n language:', error);
    return NextResponse.json({ error: 'Failed to fetch I18n language' }, { status: 500 });
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

    setUserI18nLanguage(userId, language);
    return NextResponse.json({ success: true, language });
  } catch (error) {
    console.error('Error saving I18n language:', error);
    return NextResponse.json({ error: 'Failed to save I18n language' }, { status: 500 });
  }
}
