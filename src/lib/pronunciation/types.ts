/*
! Core type definitions for the pronunciation system.
? These types form the contract between all pronunciation modules.
*/

export type Locale =
  | 'en-US'
  | 'en-GB'
  | 'en-CA'
  | 'en-AU'
  | 'fr-FR'
  | 'fr-CA'
  | 'es-ES'
  | 'pt-BR'
  | 'de-DE';

/*
! Phoneme difficulty levels for highlighting challenging sounds
*/
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/*
! Segment information mapping phonemes to character positions in original text
*/
export interface PhonemeSegment {
  phoneme: string; // e.g., 'tʃ', 'juː'
  ipa: string; // IPA representation
  arpabet: string | null; // ARPABET (English only)
  startChar: number; // Start character index in original text
  endChar: number; // End character index
  difficulty: DifficultyLevel;
  isChallenging: boolean; // Shortcut for UI highlighting
}

/*
! Complete phonetic analysis result for a text chunk
*/
export interface PhonemeData {
  originalText: string;
  locale: Locale;
  ipa: string; // Full IPA transcription: /ˈtʃʌŋk/
  arpabet: string | null; // ARPABET for English: 'CH AH NG K'
  segments: PhonemeSegment[];
  wordCount: number;
  syllableCount: number;
  createdAt: number;
  fromCache: boolean;
}

/*
! Playback configuration for TTS
*/
export interface PlaybackSettings {
  voiceURI?: string;
  voiceName?: string;
  rate: number; // 0.1 to 10.0, default 1.0
  pitch: number; // 0.0 to 2.0, default 1.0
  volume: number; // 0.0 to 1.0, default 1.0
  wordGap?: number; // ms of silence inserted between words, 0 = no extra gap
}

/*
! User voice preference per locale
*/
export interface VoicePreference {
  id: number;
  userId: number;
  locale: Locale;
  voiceURI: string | null;
  voiceName: string | null;
  rate: number;
  pitch: number;
  volume: number;
  createdAt: number;
  updatedAt: number;
}

/*
! Global TTS settings
*/
export interface TTSSettings {
  id: number;
  userId: number;
  defaultRate: number;
  defaultPitch: number;
  defaultVolume: number;
  autoPlay: boolean;
  highlightPhonemes: boolean;
  playbackMode: 'sequential' | 'segmented';
  createdAt: number;
  updatedAt: number;
}

/*
! Voice information from Web Speech API
*/
export interface VoiceInfo {
  uri: string;
  name: string;
  lang: string;
  localService: boolean;
  isDefault: boolean;
}

/*
! Result of voice availability check
*/
export interface VoiceCheckResult {
  available: boolean;
  voices: VoiceInfo[];
  recommendedFallback: {
    locale: Locale;
    reason: string;
  } | null;
}

/*
! Cache entry stored in SQLite
*/
export interface PhoneticCacheEntry {
  id: number;
  text: string;
  locale: Locale;
  ipaTranscript: string;
  arpabetTranscript: string | null;
  phoneme_data: string; // JSON serialized PhonemeSegment[]
  difficulty_mask: string; // JSON serialized boolean[]
  textHash: string;
  createdAt: number;
  updatedAt: number;
}

/*
! Pronunciation playback state
*/
export type PlaybackState = 'idle' | 'playing' | 'paused' | 'error';

/*
! TTS error types for proper error handling
*/
export interface TTSError {
  type: 'voice_unavailable' | 'playback_failed' | 'not_supported';
  message: string;
  recoverable: boolean;
}

/*
! G2P engine result before IPA conversion
*/
export interface G2PResult {
  text: string;
  locale: Locale;
  arpabet: string[]; // Array of ARPABET phonemes
  wordPhonemes: Map<string, string[]>; // word -> ARPABET array
}

/*
! IPA conversion options
*/
export interface IPAOptions {
  includeStress: boolean; // Show ˈ and ˌ markers
  includeBreaks: boolean; // Show syllable breaks
  cleanOutput: boolean; // Remove slashes for display
}
