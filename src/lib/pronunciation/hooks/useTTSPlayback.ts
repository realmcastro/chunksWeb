/*
! React hook for TTS playback control.
! Manages speech synthesis with state tracking and callbacks.
*/

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoiceInfo, PlaybackSettings, PlaybackState, Locale } from '../types';
import { getTTSCoordinator } from '../services/TTSCoordinator';

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
export function useTTSPlayback(options: UseTTSPlaybackOptions = {}): UseTTSPlaybackResult {
  const { locale = 'en-US', autoInit = true, onStateChange, onError } = options;

  const coordinator = useRef(getTTSCoordinator());
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

  // Set up state change callback
  useEffect(() => {
    coordinator.current.setLocale(locale);

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

  const initialize = useCallback(async () => {
    try {
      await coordinator.current.initialize();
      const availableVoices = await coordinator.current.getAvailableVoices();
      const defaultSettings = await coordinator.current.getDefaultSettings();

      setVoices(availableVoices);
      setSettings(defaultSettings);
      setIsInitialized(true);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to initialize TTS');
    }
  }, [onError]);

  const speak = useCallback(
    async (text: string) => {
      try {
        await coordinator.current.speak(text, settings);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Playback failed');
      }
    },
    [settings, onError],
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
        await coordinator.current.toggle(text, settings);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Playback failed');
      }
    },
    [settings, onError],
  );

  const setRate = useCallback(async (rate: number) => {
    await coordinator.current.setRate(rate);
    setSettings((prev) => ({ ...prev, rate }));
  }, []);

  const setPitch = useCallback(async (pitch: number) => {
    await coordinator.current.setPitch(pitch);
    setSettings((prev) => ({ ...prev, pitch }));
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    await coordinator.current.setVolume(volume);
    setSettings((prev) => ({ ...prev, volume }));
  }, []);

  const selectVoice = useCallback(async (voice: VoiceInfo) => {
    await coordinator.current.selectVoice(voice);
    setSettings((prev) => ({ ...prev, voiceURI: voice.uri, voiceName: voice.name }));
  }, []);

  const setLocaleFn = useCallback((newLocale: Locale) => {
    coordinator.current.setLocale(newLocale);
  }, []);

  const checkAvailability = useCallback(async () => {
    const result = await coordinator.current.checkVoiceAvailability(locale);
    return result.available;
  }, [locale]);

  return {
    state,
    isPlaying: state === 'playing',
    isPaused: state === 'paused',
    isSupported: coordinator.current.isSupported(),
    voices,
    available: true, // Will be updated by checkAvailability if needed
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
