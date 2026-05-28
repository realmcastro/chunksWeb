/*
! TTS Coordinator service.
! Manages speech playback with voice selection, rate, pitch, and volume controls.
*/

import type { VoiceInfo, PlaybackSettings, PlaybackState, Locale, TTSError } from '../types';
import { getTTSEngine } from '../engines/tts/TTSEngine';
import { getVoicePreferenceService } from './VoicePreferenceService';
import * as ttsSettingsStorage from '../storage/ttsSettingsStorage';

/*
! TTS playback event callbacks
*/
export interface TTSCallbacks {
  onStateChange?: (state: PlaybackState) => void;
  onProgress?: (charIndex: number, charLength: number) => void;
  onError?: (error: TTSError) => void;
}

/*
! TTS Coordinator manages all speech synthesis operations
*/
export class TTSCoordinator {
  private userId: number;
  private currentState: PlaybackState = 'idle';
  private currentText: string | null = null;
  private callbacks: TTSCallbacks = {};
  private locale: Locale = 'en-US';

  constructor(userId: number = 1) {
    this.userId = userId;
  }

  /*
  ! Initialize the TTS coordinator
  */
  async initialize(): Promise<void> {
    const engine = getTTSEngine();
    await engine.initialize();

    engine.setCallbacks({
      onStart: () => this.setState('playing'),
      onEnd: () => this.setState('idle'),
      onError: (error) => {
        this.setState('error');
        this.callbacks.onError?.(error);
      },
    });
  }

  /*
  ! Set the current locale for voice selection
  */
  setLocale(locale: Locale): void {
    this.locale = locale;
  }

  /*
  ! Get current playback state
  */
  getState(): PlaybackState {
    return this.currentState;
  }

  /*
  ! Get current text being played
  */
  getCurrentText(): string | null {
    return this.currentText;
  }

  /*
  ! Check if TTS is available
  */
  isSupported(): boolean {
    return getTTSEngine().isSupported();
  }

  /*
  ! Get available voices for current or specified locale
  */
  async getAvailableVoices(locale?: Locale): Promise<VoiceInfo[]> {
    const engine = getTTSEngine();
    const targetLocale = locale || this.locale;
    return engine.getVoicesForLocale(targetLocale);
  }

  /*
  ! Check voice availability
  */
  async checkVoiceAvailability(
    locale?: Locale,
  ): Promise<{ available: boolean; fallbackLocale?: Locale }> {
    const engine = getTTSEngine();
    const targetLocale = locale || this.locale;
    const result = await engine.checkVoiceAvailability(targetLocale);

    if (result.available) {
      return { available: true };
    }

    return {
      available: false,
      fallbackLocale: result.recommendedFallback?.locale,
    };
  }

  /*
  ! Speak text with optional settings override
  */
  async speak(text: string, settings?: Partial<PlaybackSettings>): Promise<void> {
    const engine = getTTSEngine();

    // Get user preferences and merge with settings
    const prefsService = getVoicePreferenceService(this.userId);
    const playbackSettings = await prefsService.getPlaybackSettings(this.locale);

    const finalSettings: PlaybackSettings = {
      voiceURI: settings?.voiceURI ?? playbackSettings.voiceURI,
      voiceName: settings?.voiceName ?? playbackSettings.voiceName,
      rate: settings?.rate ?? playbackSettings.rate,
      pitch: settings?.pitch ?? playbackSettings.pitch,
      volume: settings?.volume ?? playbackSettings.volume,
    };

    this.currentText = text;
    this.setState('playing');

    try {
      await engine.speak(text, finalSettings);
      this.setState('idle');
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }

  /*
  ! Stop current playback
  */
  stop(): void {
    const engine = getTTSEngine();
    engine.stop();
    this.currentText = null;
    this.setState('idle');
  }

  /*
  ! Pause current playback
  */
  pause(): void {
    if (this.currentState === 'playing') {
      const engine = getTTSEngine();
      engine.pause();
      this.setState('paused');
    }
  }

  /*
  ! Resume paused playback
  */
  resume(): void {
    if (this.currentState === 'paused') {
      const engine = getTTSEngine();
      engine.resume();
      this.setState('playing');
    }
  }

  /*
  ! Toggle play/stop
  */
  async toggle(text: string, settings?: Partial<PlaybackSettings>): Promise<void> {
    if (this.currentState === 'playing' && this.currentText === text) {
      this.stop();
    } else {
      await this.speak(text, settings);
    }
  }

  /*
  ! Set event callbacks
  */
  setCallbacks(callbacks: TTSCallbacks): void {
    this.callbacks = callbacks;
  }

  /*
  ! Get current default settings
  */
  async getDefaultSettings(): Promise<PlaybackSettings> {
    const prefsService = getVoicePreferenceService(this.userId);
    return prefsService.getPlaybackSettings(this.locale);
  }

  /*
  ! Update voice preference
  */
  async selectVoice(voice: VoiceInfo): Promise<void> {
    const prefsService = getVoicePreferenceService(this.userId);
    prefsService.savePreferences(this.locale, {
      voiceURI: voice.uri,
      voiceName: voice.name,
    });
  }

  /*
  ! Update playback rate
  */
  async setRate(rate: number): Promise<void> {
    const prefsService = getVoicePreferenceService(this.userId);
    prefsService.savePreferences(this.locale, { rate });
  }

  /*
  ! Update pitch
  */
  async setPitch(pitch: number): Promise<void> {
    const prefsService = getVoicePreferenceService(this.userId);
    prefsService.savePreferences(this.locale, { pitch });
  }

  /*
  ! Update volume
  */
  async setVolume(volume: number): Promise<void> {
    const prefsService = getVoicePreferenceService(this.userId);
    prefsService.savePreferences(this.locale, { volume });
  }

  /*
  ! Update state and notify callbacks
  */
  private setState(state: PlaybackState): void {
    this.currentState = state;
    this.callbacks.onStateChange?.(state);
  }
}

/*
! Singleton instance
*/
let coordinatorInstance: TTSCoordinator | null = null;

export function getTTSCoordinator(userId?: number): TTSCoordinator {
  if (!coordinatorInstance || userId !== undefined) {
    coordinatorInstance = new TTSCoordinator(userId ?? 1);
  }
  return coordinatorInstance;
}
