/*
! React hook for TTS playback control (client-safe version).
! Manages speech synthesis without server-side dependencies.
*/

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoiceInfo, PlaybackSettings, PlaybackState, Locale } from '../types';
import { getTTSCoordinatorClient, TTSCoordinatorClient } from '../services/TTSCoordinatorClient';

const TTS_STORAGE_KEY = 'tts-voice-settings';
const TTS_SETTINGS_EVENT = 'tts-settings-changed';

interface StoredSettings {
  rate: number;
  pitch: number;
  volume: number;
  voiceURI?: string;
  voiceName?: string;
  wordGap?: number;
}

/*
! Per-locale key isolates voice preferences so switching learningLanguage
! automatically loads the correct saved voice without manual reconfiguration.
? Falls back to the legacy flat key for backward compatibility with existing saves.
*/
function localeStorageKey(locale: string): string {
  return `${TTS_STORAGE_KEY}-${locale}`;
}

function readLocalSettings(locale?: string): PlaybackSettings {
  if (typeof window === 'undefined') return { rate: 1.0, pitch: 1.0, volume: 1.0 };
  try {
    const raw =
      (locale && localStorage.getItem(localeStorageKey(locale))) ||
      localStorage.getItem(TTS_STORAGE_KEY);
    if (!raw) return { rate: 1.0, pitch: 1.0, volume: 1.0 };
    const s: StoredSettings = JSON.parse(raw);
    return {
      rate: s.rate ?? 1.0,
      pitch: s.pitch ?? 1.0,
      volume: s.volume ?? 1.0,
      wordGap: s.wordGap ?? 0,
      ...(s.voiceURI ? { voiceURI: s.voiceURI, voiceName: s.voiceName } : {}),
    };
  } catch {
    return { rate: 1.0, pitch: 1.0, volume: 1.0 };
  }
}

/*
! locale is optional for backward compatibility — omitting writes to the global key.
*/
export function applyTTSSettings(settings: StoredSettings, locale?: string) {
  if (typeof window === 'undefined') return;
  const key = locale ? localeStorageKey(locale) : TTS_STORAGE_KEY;
  localStorage.setItem(key, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(TTS_SETTINGS_EVENT));
}

interface UseTTSPlaybackResult {
  state: PlaybackState;
  isPlaying: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: VoiceInfo[];
  available: boolean;
  settings: PlaybackSettings;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  toggle: (text: string) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
  setPitch: (pitch: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  selectVoice: (voice: VoiceInfo) => Promise<void>;
  setLocale: (locale: Locale) => void;
  initialize: () => Promise<void>;
}

interface UseTTSPlaybackOptions {
  locale?: Locale;
  autoInit?: boolean;
  onStateChange?: (state: PlaybackState) => void;
  onError?: (error: string) => void;
}

/*
! Hook to control TTS playback with reactive state.
*/
export function useTTSPlaybackClient(options: UseTTSPlaybackOptions = {}): UseTTSPlaybackResult {
  const { locale = 'en-US', autoInit = true, onStateChange, onError } = options;

  const coordinator = useRef<TTSCoordinatorClient>(getTTSCoordinatorClient());
  const [state, setState] = useState<PlaybackState>('idle');
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [settings, setSettings] = useState<PlaybackSettings>({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize on mount
  useEffect(() => {
    if (autoInit && !isInitialized) {
      initialize();
    }
  }, [autoInit, isInitialized]);

  // Set up state change callback; also re-read settings when locale changes
  useEffect(() => {
    coordinator.current.setLocale(locale);
    setSettings(readLocalSettings(locale));

    coordinator.current.setCallbacks({
      onStateChange: (newState) => {
        setState(newState);
        onStateChange?.(newState);
      },
      onError: (error) => {
        onError?.(error.message);
      },
    });
  }, [locale, onStateChange, onError]);

  // Re-apply settings whenever they are saved from the settings page
  useEffect(() => {
    const handler = () => setSettings(readLocalSettings(locale));
    window.addEventListener(TTS_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(TTS_SETTINGS_EVENT, handler);
  }, [locale]);

  const initialize = useCallback(async () => {
    try {
      await coordinator.current.initialize();
      const availableVoices = await coordinator.current.getAvailableVoices();

      setVoices(availableVoices);
      setSettings(readLocalSettings(locale));
      setIsInitialized(true);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to initialize TTS');
    }
  }, [onError, locale]);

  const speak = useCallback(
    async (text: string) => {
      try {
        await coordinator.current.speak(text, readLocalSettings(locale));
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Playback failed');
      }
    },
    [onError, locale],
  );

  const stop = useCallback(() => {
    coordinator.current.stop();
  }, []);

  const pause = useCallback(() => {
    coordinator.current.pause();
  }, []);

  const resume = useCallback(() => {
    coordinator.current.resume();
  }, []);

  const toggle = useCallback(
    async (text: string) => {
      try {
        if (state === 'playing') {
          coordinator.current.stop();
        } else {
          await coordinator.current.speak(text, readLocalSettings(locale));
        }
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Playback failed');
      }
    },
    [state, onError, locale],
  );

  const setRate = useCallback(async (rate: number) => {
    setSettings((prev) => ({ ...prev, rate }));
  }, []);

  const setPitch = useCallback(async (pitch: number) => {
    setSettings((prev) => ({ ...prev, pitch }));
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    setSettings((prev) => ({ ...prev, volume }));
  }, []);

  const selectVoice = useCallback(async (voice: VoiceInfo) => {
    setSettings((prev) => ({ ...prev, voiceURI: voice.uri, voiceName: voice.name }));
  }, []);

  const setLocaleFn = useCallback((newLocale: Locale) => {
    coordinator.current.setLocale(newLocale);
  }, []);

  return {
    state,
    isPlaying: state === 'playing',
    isPaused: state === 'paused',
    isSupported: coordinator.current.isSupported(),
    voices,
    available: true,
    settings,
    speak,
    stop,
    pause,
    resume,
    toggle,
    setRate,
    setPitch,
    setVolume,
    selectVoice,
    setLocale: setLocaleFn,
    initialize,
  };
}
