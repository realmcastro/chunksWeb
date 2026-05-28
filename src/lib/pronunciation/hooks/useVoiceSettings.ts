/*
! React hook for voice preference management.
! Handles loading, saving, and auto-selection of voices.
*/

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VoiceInfo, VoicePreference, Locale, PlaybackSettings } from '../types';
import { getVoicePreferenceService } from '../services/VoicePreferenceService';

interface UseVoiceSettingsResult {
  preferences: VoicePreference | null;
  availableVoices: Array<VoiceInfo & { isSelected: boolean }>;
  isLoading: boolean;
  error: string | null;
  saveVoice: (voice: VoiceInfo) => Promise<void>;
  saveRate: (rate: number) => Promise<void>;
  savePitch: (pitch: number) => Promise<void>;
  saveVolume: (volume: number) => Promise<void>;
  selectBestVoice: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface UseVoiceSettingsOptions {
  userId?: number;
  locale?: Locale;
  autoLoad?: boolean;
}

/*
! Hook to manage voice preferences per locale.
*/
export function useVoiceSettings(options: UseVoiceSettingsOptions = {}): UseVoiceSettingsResult {
  const { userId = 1, locale = 'en-US', autoLoad = true } = options;

  const [preferences, setPreferences] = useState<VoicePreference | null>(null);
  const [availableVoices, setAvailableVoices] = useState<
    Array<VoiceInfo & { isSelected: boolean }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = getVoicePreferenceService(userId);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const prefs = await service.getPreferences(locale);
      const voices = await service.getAvailableVoices(locale);

      setPreferences(prefs);
      setAvailableVoices(voices);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load voice settings';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [service, locale]);

  useEffect(() => {
    if (autoLoad) {
      fetchPreferences();
    }
  }, [autoLoad, fetchPreferences]);

  const saveVoice = useCallback(
    async (voice: VoiceInfo) => {
      try {
        const updated = service.savePreferences(locale, {
          voiceURI: voice.uri,
          voiceName: voice.name,
        });
        setPreferences(updated);
        setAvailableVoices((prev) => prev.map((v) => ({ ...v, isSelected: v.uri === voice.uri })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save voice');
      }
    },
    [service, locale],
  );

  const saveRate = useCallback(
    async (rate: number) => {
      try {
        const updated = service.savePreferences(locale, { rate });
        setPreferences(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save rate');
      }
    },
    [service, locale],
  );

  const savePitch = useCallback(
    async (pitch: number) => {
      try {
        const updated = service.savePreferences(locale, { pitch });
        setPreferences(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save pitch');
      }
    },
    [service, locale],
  );

  const saveVolume = useCallback(
    async (volume: number) => {
      try {
        const updated = service.savePreferences(locale, { volume });
        setPreferences(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save volume');
      }
    },
    [service, locale],
  );

  const selectBestVoice = useCallback(async () => {
    try {
      const updated = await service.selectBestVoice(locale);
      setPreferences(updated);
      const voices = await service.getAvailableVoices(locale);
      setAvailableVoices(voices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select best voice');
    }
  }, [service, locale]);

  const resetToDefaults = useCallback(async () => {
    try {
      const updated = service.resetPreferences(locale);
      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset preferences');
    }
  }, [service, locale]);

  return {
    preferences,
    availableVoices,
    isLoading,
    error,
    saveVoice,
    saveRate,
    savePitch,
    saveVolume,
    selectBestVoice,
    resetToDefaults,
    refetch: fetchPreferences,
  };
}
