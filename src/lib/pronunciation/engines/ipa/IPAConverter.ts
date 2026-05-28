/*
! IPA Converter module - converts between phonetic notations.
? Primary use: ARPABET to IPA conversion for English.
! Secondary: Direct IPA normalization and formatting.
*/

import type { IPAOptions } from '../../types';
import {
  ARPABET_TO_IPA,
  parseARPABET,
  arpabetToIPA,
  arpabetSequenceToIPA,
  isChallengingPhoneme,
  getPhonemeDifficulty,
} from './arpabetToIPAMap';

/*
! IPA Converter class for phonetic transcription conversion
*/
export class IPAConverter {
  private options: IPAOptions;

  constructor(options: Partial<IPAOptions> = {}) {
    this.options = {
      includeStress: options.includeStress ?? true,
      includeBreaks: options.includeBreaks ?? true,
      cleanOutput: options.cleanOutput ?? false,
    };
  }

  /*
  ! Configure converter options
  */
  configure(options: Partial<IPAOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /*
  ! Convert ARPABET string to IPA notation
  ! @param arpabet - ARPABET string (e.g., "W AH1 D Y UW1 D")
  ! @param wrapInSlashes - Whether to wrap in /.../
  ! @returns IPA notation string
  */
  fromARPABET(arpabet: string, wrapInSlashes = true): string {
    const phones = parseARPABET(arpabet);
    let ipa = arpabetSequenceToIPA(phones);

    if (this.options.includeBreaks) {
      ipa = this.addSyllableBreaks(ipa);
    }

    if (wrapInSlashes) {
      return `/${ipa}/`;
    }

    return ipa;
  }

  /*
  ! Convert ARPABET array to IPA notation
  ! @param phones - Array of ARPABET phonemes
  ! @param wrapInSlashes - Whether to wrap in /.../
  ! @returns IPA notation string
  */
  fromARPABETArray(phones: string[], wrapInSlashes = true): string {
    let ipa = arpabetSequenceToIPA(phones);

    if (this.options.includeBreaks) {
      ipa = this.addSyllableBreaks(ipa);
    }

    if (wrapInSlashes) {
      return `/${ipa}/`;
    }

    return ipa;
  }

  /*
  ! Normalize IPA string (remove extra spaces, fix spacing)
  */
  normalize(ipa: string): string {
    return ipa
      .replace(/\s+/g, ' ')
      .replace(/([ˈˌ])/g, ' $1')
      .replace(/ː/g, ':')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /*
  ! Add syllable break markers to IPA string
  ? Inserts . between syllables based on vowel sounds
  */
  addSyllableBreaks(ipa: string): string {
    // Simple syllable breaking: insert . before stressed vowels
    // This is a simplified version - full implementation would need
    // a proper syllabification algorithm
    const vowels = /([ɪʊɛæɑɔɜəɛ̯])/;
    const stressedVowels = /([ˈɪʊɛæɑɔɜə])/;

    let result = '';
    let prevWasVowel = false;

    for (let i = 0; i < ipa.length; i++) {
      const char = ipa[i];
      const nextChar = ipa[i + 1];

      result += char;

      // Check if current char is a vowel
      const isVowel = /\w/.test(char) && /[aeiouɑɜəɪʊɛɔæ]/.test(char.toLowerCase());

      if (isVowel && prevWasVowel) {
        // Two vowels in a row - likely syllable boundary
        // Add break if next is stressed
        if (nextChar && /ˈ/.test(nextChar)) {
          result += '.';
        }
      }

      prevWasVowel = isVowel;
    }

    return result;
  }

  /*
  ! Format IPA for display (remove slashes, clean whitespace)
  */
  formatForDisplay(ipa: string): string {
    let formatted = ipa.replace(/^\/|\/$/g, ''); // Remove slashes

    if (this.options.includeBreaks) {
      formatted = this.addSyllableBreaks(formatted);
    }

    return formatted;
  }

  /*
  ! Get phoneme difficulty info
  */
  getPhonemeDifficulty(phoneme: string): {
    level: 'easy' | 'medium' | 'hard';
    isChallenging: boolean;
  } {
    return {
      level: getPhonemeDifficulty(phoneme),
      isChallenging: isChallengingPhoneme(phoneme),
    };
  }

  /*
  ! Convert single ARPABET phone to IPA
  */
  phoneToIPA(phone: string): string {
    return arpabetToIPA(phone);
  }
}

/*
! Singleton instance for convenience
*/
let converterInstance: IPAConverter | null = null;

export function getIPAConverter(options?: Partial<IPAOptions>): IPAConverter {
  if (!converterInstance) {
    converterInstance = new IPAConverter(options);
  } else if (options) {
    converterInstance.configure(options);
  }
  return converterInstance;
}

/*
! Quick conversion function for common use cases
*/
export function convertARPABETtoIPA(arpabet: string, includeStress = true): string {
  const converter = getIPAConverter({ includeStress });
  return converter.fromARPABET(arpabet, false);
}

/*
! Validate IPA string format
*/
export function isValidIPA(ipa: string): boolean {
  // Basic validation - check for valid IPA characters
  const validIPARegex = /^[\/\s\wːʃʒθðŋɹɜˈˌɑɜəɪʊɛɔæɐʔʍɥhɲɟɾʝɾ]+$/;
  return validIPARegex.test(ipa.replace(/[\/\-\.]/g, ''));
}
