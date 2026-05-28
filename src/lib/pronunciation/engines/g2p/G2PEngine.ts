/*
! Abstract interface for Grapheme-to-Phoneme conversion engines.
? Each supported language/region implements this interface.
*/

import type { Locale, PhonemeData, PhonemeSegment, G2PResult } from '../../types';

/*
! Base interface that all G2P engines must implement
*/
export interface G2PEngine {
  /*
  ! The locale this engine supports (e.g., 'en-US', 'fr-FR')
  */
  readonly locale: Locale;

  /*
  ! Whether this engine is currently available (loaded, no errors)
  */
  readonly isAvailable: boolean;

  /*
  ! Initialize the engine (load dictionaries, etc.)
  ! Must be called before any conversion
  */
  initialize(): Promise<void>;

  /*
  ! Convert text to phonemes
  ! @param text - The text to convert
  ! @returns G2P result with raw phoneme data
  */
  convert(text: string): Promise<G2PResult>;

  /*
  ! Convert text to full PhonemeData (IPA-ready)
  ! @param text - The text to convert
  ! @returns Complete phoneme analysis
  */
  analyze(text: string): Promise<PhonemeData>;

  /*
  ! Check if a word exists in the engine's dictionary
  ! @param word - Word to check
  ! @returns true if word is in dictionary
  */
  hasWord(word: string): boolean;

  /*
  ! Clean up resources when engine is no longer needed
  */
  dispose(): void;
}

/*
! Factory function type for creating G2P engines
*/
export type G2PEngineFactory = (locale: Locale) => G2PEngine | null;

/*
! Registry of available G2P engines by locale
*/
export class G2PEngineRegistry {
  private static instance: G2PEngineRegistry;
  private engines: Map<Locale, G2PEngine> = new Map();
  private factories: Map<Locale, G2PEngineFactory> = new Map();

  private constructor() {}

  static getInstance(): G2PEngineRegistry {
    if (!G2PEngineRegistry.instance) {
      G2PEngineRegistry.instance = new G2PEngineRegistry();
    }
    return G2PEngineRegistry.instance;
  }

  /*
  ! Register a factory for creating engines for a locale
  */
  registerFactory(locale: Locale, factory: G2PEngineFactory): void {
    this.factories.set(locale, factory);
  }

  /*
  ! Get or create an engine for the specified locale
  */
  getEngine(locale: Locale): G2PEngine | null {
    // Return cached engine if available
    if (this.engines.has(locale)) {
      const cached = this.engines.get(locale)!;
      if (cached.isAvailable) return cached;
    }

    // Try factory to create new engine
    const factory = this.factories.get(locale);
    if (!factory) return null;

    const engine = factory(locale);
    if (engine) {
      this.engines.set(locale, engine);
    }

    return engine;
  }

  /*
  ! Get all registered locales
  */
  getSupportedLocales(): Locale[] {
    return Array.from(this.factories.keys());
  }

  /*
  ! Clear all cached engines
  */
  clearAll(): void {
    for (const engine of Array.from(this.engines.values())) {
      engine.dispose();
    }
    this.engines.clear();
  }
}

/*
! Abstract base class with common G2P engine functionality
*/
export abstract class BaseG2PEngine implements G2PEngine {
  abstract readonly locale: Locale;
  protected _isAvailable = false;
  protected initializationPromise: Promise<void> | null = null;

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  abstract initialize(): Promise<void>;
  abstract convert(text: string): Promise<G2PResult>;
  abstract analyze(text: string): Promise<PhonemeData>;
  abstract hasWord(word: string): boolean;
  dispose(): void {
    // Override in subclass if cleanup needed
  }

  /*
  ! Helper to create PhonemeSegment array from text and phonemes
  */
  protected createSegments(
    text: string,
    words: string[],
    wordPhonemes: Map<string, string[]>,
    toIPA: (phones: string[]) => string,
  ): PhonemeSegment[] {
    const segments: PhonemeSegment[] = [];

    for (const word of words) {
      const startChar = text.indexOf(word);
      if (startChar === -1) continue;

      const phones = wordPhonemes.get(word) || [];
      const ipa = toIPA(phones);

      // Calculate character positions
      let charPos = startChar;
      for (const phone of phones) {
        const phoneIPA = this.phoneToIPA(phone);
        const isChallenging = this.isChallenging(phoneIPA);

        segments.push({
          phoneme: phone,
          ipa: phoneIPA,
          arpabet: this.locale.startsWith('en') ? phone : null,
          startChar: charPos,
          endChar: charPos + 1,
          difficulty: this.getDifficulty(phoneIPA),
          isChallenging,
        });
        charPos += 1;
      }
    }

    return segments;
  }

  /*
  ! Convert single phone to IPA (override in subclass for language-specific rules)
  */
  protected phoneToIPA(phone: string): string {
    return phone; // Base implementation - override
  }

  /*
  ! Check if phoneme is challenging (override for language-specific rules)
  */
  protected isChallenging(_ipa: string): boolean {
    return false;
  }

  /*
  ! Get difficulty level (override for language-specific rules)
  */
  protected getDifficulty(_ipa: string): 'easy' | 'medium' | 'hard' {
    return 'easy';
  }
}
