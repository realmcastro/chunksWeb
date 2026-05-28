import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTTSSettings, saveTTSSettings } from '@/lib/pronunciation/storage/ttsSettingsStorage';
import {
  getAllVoicePreferences,
  saveVoicePreferences,
} from '@/lib/pronunciation/storage/voicePrefsStorage';
import type { Locale } from '@/lib/pronunciation/types';

async function getUserIdFromCookie(): Promise<number | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  try {
    const session = JSON.parse(sessionCookie.value);
    return session.userId || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const rawTts = getTTSSettings(userId);
    const rawPrefs = getAllVoicePreferences(userId);

    // Normalize snake_case DB columns to camelCase for the client
    const ttsSettings = rawTts
      ? {
          defaultRate: (rawTts as unknown as Record<string, number>)['default_rate'] ?? rawTts.defaultRate ?? 1.0,
          defaultPitch: (rawTts as unknown as Record<string, number>)['default_pitch'] ?? rawTts.defaultPitch ?? 1.0,
          defaultVolume: (rawTts as unknown as Record<string, number>)['default_volume'] ?? rawTts.defaultVolume ?? 1.0,
        }
      : { defaultRate: 1.0, defaultPitch: 1.0, defaultVolume: 1.0 };

    const voicePreferences = rawPrefs.map((p) => {
      const raw = p as unknown as Record<string, unknown>;
      return {
        locale: p.locale,
        voiceURI: raw['voice_uri'] ?? p.voiceURI ?? null,
        voiceName: raw['voice_name'] ?? p.voiceName ?? null,
        rate: p.rate,
        pitch: p.pitch,
        volume: p.volume,
      };
    });

    return NextResponse.json({ ttsSettings, voicePreferences });
  } catch (error) {
    console.error('Error fetching voice settings:', error);
    return NextResponse.json({ error: 'Failed to fetch voice settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();

    // Save global rate/pitch/volume to tts_settings
    saveTTSSettings(userId, {
      defaultRate: body.rate,
      defaultPitch: body.pitch,
      defaultVolume: body.volume ?? 1.0,
    });

    // Save voice selection per locale if provided
    if (body.locale && body.voiceURI !== undefined) {
      saveVoicePreferences(userId, body.locale as Locale, {
        voiceURI: body.voiceURI || null,
        voiceName: body.voiceName || null,
        rate: body.rate ?? 1.0,
        pitch: body.pitch ?? 1.0,
        volume: body.volume ?? 1.0,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving voice settings:', error);
    return NextResponse.json({ error: 'Failed to save voice settings' }, { status: 500 });
  }
}
