/*
! Web Speech API TTS Engine wrapper.
! Provides unified interface for speech synthesis with fallback support.
*/

import type { VoiceInfo, PlaybackSettings, VoiceCheckResult, Locale, TTSError } from '../../types';

// Check if Web Speech API is available
const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/*
! Voice registry for caching and querying available voices
*/
class VoiceRegistry {
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private loadPromise: Promise<void> | null = null;

  /*
  ! Load all available voices from the browser
  ! Must be called after user interaction due to browser requirements
  */
  async loadVoices(): Promise<void> {
    if (!isSpeechSynthesisSupported) return;
    if (this.voicesLoaded) return;

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve) => {
      const synth = window.speechSynthesis;

      // Some browsers load voices asynchronously
      if (synth.getVoices().length > 0) {
        this.voices = synth.getVoices();
        this.voicesLoaded = true;
        resolve();
      }

      synth.onvoiceschanged = () => {
        this.voices = synth.getVoices();
        this.voicesLoaded = true;
        resolve();
      };

      // Fallback timeout
      setTimeout(() => {
        if (!this.voicesLoaded) {
          this.voices = synth.getVoices();
          this.voicesLoaded = true;
          resolve();
        }
      }, 1000);
    });

    return this.loadPromise;
  }

  /*
  ! Get all available voices
  */
  getAllVoices(): VoiceInfo[] {
    return this.voices.map((v) => ({
      uri: v.voiceURI,
      name: v.name,
      lang: v.lang,
      localService: v.localService,
      isDefault: v.default,
    }));
  }

  /*
  ! Get voices matching a specific locale
  ! @param locale - Full locale (e.g., 'en-US') or partial (e.g., 'en')
  */
  getVoicesForLocale(locale: Locale | string): VoiceInfo[] {
    const [lang] = locale.split('-');

    return this.voices
      .filter((v) => v.lang.startsWith(lang))
      .map((v) => ({
        uri: v.voiceURI,
        name: v.name,
        lang: v.lang,
        localService: v.localService,
        isDefault: v.default,
      }));
  }

  /*
  ! Find best voice for a locale with fallback hierarchy
  */
  findBestVoice(locale: Locale): VoiceInfo | null {
    const matchingVoices = this.getVoicesForLocale(locale);

    if (matchingVoices.length === 0) return null;

    // Sort by preference:
    // 1. Local voices first
    // 2. Exact locale match
    // 3. Premium/Enhanced in name
    const sorted = [...matchingVoices].sort((a, b) => {
      if (a.localService && !b.localService) return -1;
      if (!a.localService && b.localService) return 1;
      if (a.lang === locale && b.lang !== locale) return -1;
      if (a.lang !== locale && b.lang === locale) return 1;

      const premiumKeywords = ['Premium', 'Enhanced', 'Natural', 'Studio'];
      const scoreA = premiumKeywords.findIndex((k) => a.name.includes(k));
      const scoreB = premiumKeywords.findIndex((k) => b.name.includes(k));
      if (scoreA !== -1 && scoreB === -1) return -1;
      if (scoreB !== -1 && scoreA === -1) return 1;

      return 0;
    });

    return sorted[0] || null;
  }

  /*
  ! Get voice by URI
  */
  getVoiceByURI(uri: string): SpeechSynthesisVoice | null {
    return this.voices.find((v) => v.voiceURI === uri) || null;
  }

  isLoaded(): boolean {
    return this.voicesLoaded;
  }
}

export const voiceRegistry = new VoiceRegistry();

/*
! TTS Engine class for speech synthesis
*/
export class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: TTSError) => void) | null = null;

  constructor() {
    if (isSpeechSynthesisSupported) {
      this.synth = window.speechSynthesis;
    }
  }

  /*
  ! Check if TTS is supported
  */
  isSupported(): boolean {
    return isSpeechSynthesisSupported;
  }

  /*
  ! Initialize voices - must be called after user interaction
  */
  async initialize(): Promise<void> {
    await voiceRegistry.loadVoices();
  }

  /*
  ! Check voice availability for a locale
  */
  async checkVoiceAvailability(locale: Locale): Promise<VoiceCheckResult> {
    await voiceRegistry.loadVoices();

    const voices = voiceRegistry.getVoicesForLocale(locale);

    if (voices.length > 0) {
      return {
        available: true,
        voices,
        recommendedFallback: null,
      };
    }

    // Try parent locale
    const parentLocale = locale.split('-')[0] as Locale;
    const parentVoices = voiceRegistry.getVoicesForLocale(parentLocale);

    if (parentVoices.length > 0) {
      return {
        available: false,
        voices: parentVoices,
        recommendedFallback: {
          locale: parentLocale,
          reason: `No voices for ${locale}, falling back to ${parentLocale}`,
        },
      };
    }

    return {
      available: false,
      voices: [],
      recommendedFallback: null,
    };
  }

  /*
  ! Get all available voices
  */
  async getAvailableVoices(): Promise<VoiceInfo[]> {
    await voiceRegistry.loadVoices();
    return voiceRegistry.getAllVoices();
  }

  /*
  ! Get voices for specific locale
  */
  async getVoicesForLocale(locale: Locale): Promise<VoiceInfo[]> {
    await voiceRegistry.loadVoices();
    return voiceRegistry.getVoicesForLocale(locale);
  }

  /*
  ! Speak text with given settings
  */
  speak(text: string, settings: PlaybackSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject({
          type: 'not_supported',
          message: 'Speech synthesis not supported',
          recoverable: false,
        });
        return;
      }

      // Cancel any ongoing speech
      this.synth!.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply settings
      utterance.rate = settings.rate ?? 1.0;
      utterance.pitch = settings.pitch ?? 1.0;
      utterance.volume = settings.volume ?? 1.0;

      // Set voice if specified
      if (settings.voiceURI) {
        const voice = voiceRegistry.getVoiceByURI(settings.voiceURI);
        if (voice) {
          utterance.voice = voice;
        }
      }

      // Set language based on voice or default
      utterance.lang = settings.voiceURI
        ? voiceRegistry.getVoiceByURI(settings.voiceURI)?.lang || 'en-US'
        : 'en-US';

      utterance.onstart = () => {
        this.onStartCallback?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.onEndCallback?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        const error: TTSError = {
          type: 'playback_failed',
          message: event.error || 'Unknown speech synthesis error',
          recoverable: event.error !== 'interrupted',
        };
        this.onErrorCallback?.(error);
        reject(error);
      };

      this.currentUtterance = utterance;
      this.synth!.speak(utterance);
    });
  }

  /*
  ! Pause speech
  */
  pause(): void {
    if (this.synth) {
      this.synth.pause();
    }
  }

  /*
  ! Resume speech
  */
  resume(): void {
    if (this.synth) {
      this.synth.resume();
    }
  }

  /*
  ! Stop speech
  */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /*
  ! Check if currently speaking
  */
  isSpeaking(): boolean {
    return this.synth?.speaking ?? false;
  }

  /*
  ! Set event callbacks
  */
  setCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: TTSError) => void;
  }): void {
    this.onStartCallback = callbacks.onStart ?? null;
    this.onEndCallback = callbacks.onEnd ?? null;
    this.onErrorCallback = callbacks.onError ?? null;
  }
}

/*
! Singleton instance
*/
let ttsEngineInstance: TTSEngine | null = null;

export function getTTSEngine(): TTSEngine {
  if (!ttsEngineInstance) {
    ttsEngineInstance = new TTSEngine();
  }
  return ttsEngineInstance;
}
