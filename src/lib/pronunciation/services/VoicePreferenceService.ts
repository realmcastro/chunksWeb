/*
! Voice preference management service.
! Handles user voice settings per locale with SQLite persistence.
*/

import type { VoicePreference, VoiceInfo, Locale, PlaybackSettings } from '../types';
import * as voicePrefsStorage from '../storage/voicePrefsStorage';
import { getTTSEngine } from '../engines/tts/TTSEngine';

/*
! Voice Preference Service for managing user voice settings
*/
export class VoicePreferenceService {
  private userId: number;

  constructor(userId: number = 1) {
    this.userId = userId;
  }

  /*
  ! Get voice preferences for a locale, merged with engine defaults
  */
  async getPreferences(locale: Locale): Promise<VoicePreference> {
    const stored = voicePrefsStorage.getVoicePreferences(this.userId, locale);

    if (stored) {
      return stored;
    }

    // Return defaults if no stored preferences
    return {
      id: 0,
      userId: this.userId,
      locale,
      voiceURI: null,
      voiceName: null,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      createdAt: 0,
      updatedAt: 0,
    };
  }

  /*
  ! Get PlaybackSettings for TTS from stored preferences
  */
  async getPlaybackSettings(locale: Locale): Promise<PlaybackSettings> {
    const prefs = await this.getPreferences(locale);

    // If no voice is set, find best available voice
    let voiceURI = prefs.voiceURI;
    let voiceName = prefs.voiceName;

    if (!voiceURI) {
      const engine = getTTSEngine();
      const availableVoices = await engine.getVoicesForLocale(locale);
      const bestVoice = availableVoices[0];

      if (bestVoice) {
        voiceURI = bestVoice.uri;
        voiceName = bestVoice.name;
      }
    }

    return {
      voiceURI: voiceURI || undefined,
      voiceName: voiceName || undefined,
      rate: prefs.rate,
      pitch: prefs.pitch,
      volume: prefs.volume,
    };
  }

  /*
  ! Save voice preferences
  */
  savePreferences(
    locale: Locale,
    prefs: Partial<Omit<VoicePreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): VoicePreference {
    return voicePrefsStorage.saveVoicePreferences(this.userId, locale, prefs);
  }

  /*
  ! Get all stored preferences for user
  */
  getAllPreferences(): VoicePreference[] {
    return voicePrefsStorage.getAllVoicePreferences(this.userId);
  }

  /*
  ! Reset preferences to defaults
  */
  resetPreferences(locale: Locale): VoicePreference {
    return voicePrefsStorage.resetVoicePreferences(this.userId, locale);
  }

  /*
  ! Validate that a voice is still available
  */
  async validateVoice(voiceURI: string, locale: Locale): Promise<boolean> {
    const engine = getTTSEngine();
    const availableVoices = await engine.getVoicesForLocale(locale);
    return availableVoices.some((v) => v.uri === voiceURI);
  }

  /*
  ! Auto-select best available voice and save as preference
  */
  async selectBestVoice(locale: Locale): Promise<VoicePreference> {
    const engine = getTTSEngine();
    const availableVoices = await engine.getVoicesForLocale(locale);

    if (availableVoices.length === 0) {
      return this.getPreferences(locale);
    }

    // Find best local voice
    const localVoices = availableVoices.filter((v) => v.localService);
    const targetVoices = localVoices.length > 0 ? localVoices : availableVoices;

    // Prefer exact locale match
    const exactMatch = targetVoices.find((v) => v.lang === locale);
    const selectedVoice = exactMatch || targetVoices[0];

    return this.savePreferences(locale, {
      voiceURI: selectedVoice.uri,
      voiceName: selectedVoice.name,
    });
  }

  /*
  ! Get available voices for locale with preference highlighting
  */
  async getAvailableVoices(locale: Locale): Promise<Array<VoiceInfo & { isSelected: boolean }>> {
    const engine = getTTSEngine();
    const allVoices = await engine.getVoicesForLocale(locale);
    const prefs = await this.getPreferences(locale);

    return allVoices.map((v) => ({
      ...v,
      isSelected: v.uri === prefs.voiceURI,
    }));
  }
}

/*
! Singleton instance for convenience
*/
let serviceInstance: VoicePreferenceService | null = null;

export function getVoicePreferenceService(userId?: number): VoicePreferenceService {
  if (!serviceInstance || userId !== undefined) {
    serviceInstance = new VoicePreferenceService(userId ?? 1);
  }
  return serviceInstance;
}
