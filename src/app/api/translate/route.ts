import { NextResponse } from 'next/server';

/*
! Translation API endpoint.
? Uses LibreTranslate (self-hosted or public instance) for translations.
? Falls back to a simple mock translation for development if no API is configured.
*/

const LIBRE_TRANSLATE_URL = process.env.LIBRE_TRANSLATE_URL || '';
const LIBRE_TRANSLATE_API_KEY = process.env.LIBRE_TRANSLATE_API_KEY || '';

const LANGUAGE_CODES: Record<string, string> = {
  en: 'en',
  pt: 'pt',
  es: 'es',
  fr: 'fr',
};

// Fallback mock translations for common phrases (for development without API)
const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    hello: 'bonjour',
    'how are you': 'comment allez-vous',
    'good morning': 'bonjour',
    'thank you': 'merci',
    please: "s'il vous plaît",
  },
  es: {
    hello: 'hola',
    'how are you': 'cómo estás',
    'good morning': 'buenos días',
    'thank you': 'gracias',
    please: 'por favor',
  },
  pt: {
    hello: 'olá',
    'how are you': 'como você está',
    'good morning': 'bom dia',
    'thank you': 'obrigado',
    please: 'por favor',
  },
};

interface TranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

async function translateWithLibreTranslate(
  text: string,
  targetLang: string,
  sourceLang: string = 'en',
): Promise<string> {
  if (!LIBRE_TRANSLATE_URL) {
    throw new Error('LibreTranslate URL not configured');
  }

  const response = await fetch(`${LIBRE_TRANSLATE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(LIBRE_TRANSLATE_API_KEY ? { Authorization: `Bearer ${LIBRE_TRANSLATE_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text',
    }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate API error: ${response.status}`);
  }

  const data = await response.json();
  return data.translatedText as string;
}

function getMockTranslation(text: string, targetLang: string): string | null {
  const lowerText = text.toLowerCase().trim();
  const langDict = MOCK_TRANSLATIONS[targetLang];

  if (!langDict) return null;

  // Check for exact match
  if (langDict[lowerText]) {
    return langDict[lowerText];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(langDict)) {
    if (lowerText.includes(key)) {
      return value;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body: TranslateRequest = await request.json();
    const { text, targetLanguage, sourceLanguage = 'en' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    if (!targetLanguage || !LANGUAGE_CODES[targetLanguage]) {
      return NextResponse.json({ error: 'Invalid target language' }, { status: 400 });
    }

    // If source and target are the same, return original text
    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({ translation: text, cached: false });
    }

    let translation: string;

    try {
      // Try LibreTranslate first
      if (LIBRE_TRANSLATE_URL) {
        translation = await translateWithLibreTranslate(text, targetLanguage, sourceLanguage);
      } else {
        // Fallback to mock translation
        const mockResult = getMockTranslation(text, targetLanguage);
        if (mockResult) {
          translation = mockResult;
        } else {
          // If no mock available, return original with a note (development mode)
          translation = `[${targetLanguage}] ${text}`;
        }
      }
    } catch (error) {
      console.error('Translation API error:', error);
      // Fallback: return original text if translation fails
      translation = text;
    }

    return NextResponse.json({
      translation,
      cached: false,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error('Error in translate endpoint:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
