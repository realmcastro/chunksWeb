/*
! Client-safe TTS Coordinator service.
! Manages speech playback without server-side dependencies.
*/

import type { VoiceInfo, PlaybackSettings, PlaybackState, Locale, TTSError } from '../types';

// Check if Web Speech API is available
const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voiceRegistryLoaded = false;
let availableVoicesList: SpeechSynthesisVoice[] = [];
let onVoicesChanged: (() => void) | null = null;

// Initialize voice registry
function initializeVoiceRegistry(): Promise<void> {
  if (!isSpeechSynthesisSupported) {
    return Promise.resolve();
  }

  if (voiceRegistryLoaded) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const synth = window.speechSynthesis;

    // If voices are already loaded
    if (synth.getVoices().length > 0) {
      availableVoicesList = synth.getVoices();
      voiceRegistryLoaded = true;
      resolve();
      return;
    }

    // Wait for voices to load
    const handleVoicesChanged = () => {
      availableVoicesList = synth.getVoices();
      voiceRegistryLoaded = true;
      onVoicesChanged?.();
      resolve();
    };

    synth.onvoiceschanged = handleVoicesChanged;

    // Timeout fallback
    setTimeout(() => {
      if (!voiceRegistryLoaded) {
        availableVoicesList = synth.getVoices();
        voiceRegistryLoaded = true;
        resolve();
      }
    }, 1000);
  });
}

// Get voices for locale
function getVoicesForLocale(locale: Locale | string): VoiceInfo[] {
  const [lang] = locale.split('-');

  return availableVoicesList
    .filter((v) => v.lang.startsWith(lang))
    .map((v) => ({
      uri: v.voiceURI,
      name: v.name,
      lang: v.lang,
      localService: v.localService,
      isDefault: v.default,
    }));
}

// Find best voice for locale
function findBestVoice(locale: Locale): VoiceInfo | null {
  const matchingVoices = getVoicesForLocale(locale);

  if (matchingVoices.length === 0) return null;

  // Sort by preference
  const sorted = [...matchingVoices].sort((a, b) => {
    if (a.localService && !b.localService) return -1;
    if (!a.localService && b.localService) return 1;
    if (a.lang === locale && b.lang !== locale) return -1;
    if (a.lang !== locale && b.lang === locale) return 1;
    return 0;
  });

  return sorted[0] || null;
}

// TTS playback state
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentState: PlaybackState = 'idle';
let stateChangeCallback: ((state: PlaybackState) => void) | null = null;
let errorCallback: ((error: TTSError) => void) | null = null;
let currentSpeakSession = 0;
let currentWordGapTimeout: ReturnType<typeof setTimeout> | null = null;

/*
! Client-safe TTS Coordinator manages all speech synthesis operations
*/
export class TTSCoordinatorClient {
  private locale: Locale = 'en-US';

  constructor() {
    if (isSpeechSynthesisSupported) {
      window.speechSynthesis.onvoiceschanged = () => {
        availableVoicesList = window.speechSynthesis.getVoices();
      };
    }
  }

  /*
  ! Initialize the TTS coordinator
  */
  async initialize(): Promise<void> {
    await initializeVoiceRegistry();
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
    return currentState;
  }

  /*
  ! Check if TTS is available
  */
  isSupported(): boolean {
    return isSpeechSynthesisSupported;
  }

  /*
  ! Get available voices for current or specified locale
  */
  async getAvailableVoices(locale?: Locale): Promise<VoiceInfo[]> {
    await initializeVoiceRegistry();
    const targetLocale = locale || this.locale;
    return getVoicesForLocale(targetLocale);
  }

  /*
  ! Check voice availability
  */
  async checkVoiceAvailability(
    locale?: Locale,
  ): Promise<{ available: boolean; fallbackLocale?: Locale }> {
    await initializeVoiceRegistry();
    const targetLocale = locale || this.locale;
    const voices = getVoicesForLocale(targetLocale);

    if (voices.length > 0) {
      return { available: true };
    }

    // Try parent locale
    const parentLocale = targetLocale.split('-')[0] as Locale;
    const parentVoices = getVoicesForLocale(parentLocale);

    if (parentVoices.length > 0) {
      return { available: false, fallbackLocale: parentLocale };
    }

    return { available: false };
  }

  /*
  ! Speak a single utterance — resolves when done or interrupted.
  */
  private speakOne(
    text: string,
    settings?: Partial<PlaybackSettings>,
    onStarted?: (startupMs: number) => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      const speakTime = Date.now();

      utterance.rate = settings?.rate ?? 1.0;
      utterance.pitch = settings?.pitch ?? 1.0;
      utterance.volume = settings?.volume ?? 1.0;

      const freshVoices = window.speechSynthesis.getVoices();
      const voiceList = freshVoices.length > 0 ? freshVoices : availableVoicesList;
      if (freshVoices.length > 0) availableVoicesList = freshVoices;

      if (settings?.voiceURI) {
        const voice = voiceList.find((v) => v.voiceURI === settings.voiceURI);
        if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
      } else {
        const bestVoice = findBestVoice(this.locale);
        if (bestVoice) {
          const voice = voiceList.find((v) => v.voiceURI === bestVoice.uri);
          if (voice) utterance.voice = voice;
        }
        utterance.lang = this.locale;
      }

      utterance.onstart = () => { onStarted?.(Date.now() - speakTime); };
      utterance.onend = () => { currentUtterance = null; resolve(); };
      // Resolve on interrupt (normal stop) so the word-gap loop exits cleanly
      utterance.onerror = (event) => {
        currentUtterance = null;
        if (event.error !== 'interrupted') {
          errorCallback?.({
            type: 'playback_failed',
            message: event.error || 'Unknown speech synthesis error',
            recoverable: true,
          });
        }
        resolve();
      };

      currentUtterance = utterance;
      synth.speak(utterance);
    });
  }

  /*
  ! Speak text with optional settings override.
  ! When wordGap > 0, splits into words and inserts silence between each.
  */
  async speak(text: string, settings?: Partial<PlaybackSettings>): Promise<void> {
    if (!isSpeechSynthesisSupported) {
      throw { type: 'not_supported' as const, message: 'Speech synthesis not supported', recoverable: false };
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    if (currentWordGapTimeout !== null) {
      clearTimeout(currentWordGapTimeout);
      currentWordGapTimeout = null;
    }

    ++currentSpeakSession;
    const sessionId = currentSpeakSession;

    currentState = 'playing';
    stateChangeCallback?.(currentState);

    const wordGap = settings?.wordGap ?? 0;
    const tokens = wordGap > 0 ? text.trim().split(/\s+/).filter(Boolean) : [text];

    // Startup latency = time from synth.speak() to utterance.onstart.
    // We subtract it from the next gap so the perceived silence matches wordGap.
    // 100ms is a safe first-word estimate; updated after each word fires onstart.
    let lastStartupMs = 100;

    for (let i = 0; i < tokens.length; i++) {
      if (currentSpeakSession !== sessionId) return;

      await this.speakOne(tokens[i], settings, (ms) => { lastStartupMs = ms; });

      if (currentSpeakSession !== sessionId) return;

      if (i < tokens.length - 1) {
        const compensatedDelay = Math.max(0, wordGap - lastStartupMs);
        await new Promise<void>((resolve) => {
          currentWordGapTimeout = setTimeout(() => {
            currentWordGapTimeout = null;
            resolve();
          }, compensatedDelay);
        });
      }
    }

    if (currentSpeakSession === sessionId) {
      currentState = 'idle';
      stateChangeCallback?.(currentState);
    }
  }

  /*
  ! Stop current playback
  */
  stop(): void {
    if (isSpeechSynthesisSupported) {
      window.speechSynthesis.cancel();
      ++currentSpeakSession;
      if (currentWordGapTimeout !== null) {
        clearTimeout(currentWordGapTimeout);
        currentWordGapTimeout = null;
      }
      currentUtterance = null;
      currentState = 'idle';
      stateChangeCallback?.(currentState);
    }
  }

  /*
  ! Pause current playback
  */
  pause(): void {
    if (isSpeechSynthesisSupported && currentState === 'playing') {
      window.speechSynthesis.pause();
      currentState = 'paused';
      stateChangeCallback?.(currentState);
    }
  }

  /*
  ! Resume paused playback
  */
  resume(): void {
    if (isSpeechSynthesisSupported && currentState === 'paused') {
      window.speechSynthesis.resume();
      currentState = 'playing';
      stateChangeCallback?.(currentState);
    }
  }

  /*
  ! Set event callbacks
  */
  setCallbacks(callbacks: {
    onStateChange?: (state: PlaybackState) => void;
    onError?: (error: TTSError) => void;
  }): void {
    stateChangeCallback = callbacks.onStateChange ?? null;
    errorCallback = callbacks.onError ?? null;
  }
}

/*
! Singleton instance
*/
let coordinatorInstance: TTSCoordinatorClient | null = null;

export function getTTSCoordinatorClient(): TTSCoordinatorClient {
  if (!coordinatorInstance) {
    coordinatorInstance = new TTSCoordinatorClient();
  }
  return coordinatorInstance;
}
