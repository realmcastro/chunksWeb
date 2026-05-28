/*
! ARPABET to IPA mapping table for English phonemes.
? Reference: https://en.wikipedia.org/wiki/ARPABET#Key
! Mappings based on standard CMU Pronouncing Dictionary conventions.
*/

export const ARPABET_TO_IPA: Record<string, string> = {
  // Vowels
  AA: 'ɑ', // odd
  AE: 'æ', // at
  AH: 'ʌ', // but
  AO: 'ɔ', // caught
  AW: 'aʊ', // bout
  AY: 'aɪ', // bite
  EH: 'ɛ', // bed
  ER: 'ɜ', // bird
  EY: 'eɪ', // bait
  IH: 'ɪ', // bit
  IY: 'i', // beat
  OW: 'oʊ', // boat
  OY: 'ɔɪ', // boy
  UH: 'ʊ', // book
  UW: 'u', // boot
  UX: 'u', // toot (archaic)
  AX: 'ə', // about (schwa)
  AXH: 'ə', // actor (archaic schwa)
  IX: 'ɪ', // entries (reduced /ɪ/)
  IXY: 'ɪ', // picks (archaic reduced /ɪ/)
  EL: 'l̩', // bottle (syllabic)
  EM: 'm̩', // rhythm (syllabic)
  EN: 'n̩', // button (syllabic)

  // Consonants
  P: 'p', // pat
  B: 'b', // bat
  T: 't', // tap
  D: 'd', // dad
  K: 'k', // key
  G: 'g', // get
  M: 'm', // map
  N: 'n', // nap
  NG: 'ŋ', // sing
  F: 'f', // fin
  V: 'v', // van
  TH: 'θ', // thin
  DH: 'ð', // then
  S: 's', // sip
  Z: 'z', // zip
  SH: 'ʃ', // ship
  ZH: 'ʒ', // measure
  HH: 'h', // hat
  CH: 'tʃ', // chip
  JH: 'dʒ', // jump
  Y: 'j', // yard
  R: 'ɹ', // rat
  L: 'l', // let
  W: 'w', // wet
  Q: 'ʔ', // glottal stop (uh-oh)

  // Stress markers (added as suffix)
  '0': 'ˌ', // No stress (secondary)
  '1': 'ˈ', // Primary stress
  '2': 'ˌ', // Secondary stress
};

/*
! Reverse IPA to ARPABET mapping (for lookup)
*/
export const IPA_TO_ARPABET: Record<string, string> = Object.fromEntries(
  Object.entries(ARPABET_TO_IPA).map(([k, v]) => [v, k]),
);

/*
! English vowel sounds that are typically challenging for learners
? Classification based on typical L2 pronunciation difficulty
*/
export const CHALLENGING_VOWELS: Set<string> = new Set([
  'æ', // AE - trap vs. bath merger
  'ʌ', // AH - strut vowel
  'ɔ', // AO - thought vs. cot merger
  'ɜ', // ER - nurse
  'ɑ', // AA - father vs. start
  'eɪ', // EY - face vowel
  'oʊ', // OW - goat vowel
  'aʊ', // AW - mouth vowel
  'ɔɪ', // OY - choice vowel
]);

/*
! English consonant sounds that are typically challenging for learners
*/
export const CHALLENGING_CONSONANTS: Set<string> = new Set([
  'θ', // TH (voiceless) - thing
  'ð', // DH (voiced) - this
  'ŋ', // NG - sing
  'ʃ', // SH - ship
  'ʒ', // ZH - measure
  'tʃ', // CH - chip
  'dʒ', // JH - jump
  'ɹ', // R - rat (rhotic)
]);

/*
! Vowel pairs that are commonly confused
? Useful for highlighting minimal pairs
*/
export const VOWEL_CONFUSION_PAIRS: [string, string][] = [
  ['ɪ', 'iː'], // ship vs. sheep
  ['ɛ', 'eɪ'], // bed vs. bait
  ['æ', 'ɑ'], // trap vs. father
  ['ʌ', 'ɑ'], // strut vs. father
  ['ɔ', 'ɑ'], // caught vs. cot
  ['ʊ', 'uː'], // book vs. boot
];

/*
! All challenging phonemes combined
*/
export const CHALLENGING_PHONEMES: Set<string> = new Set([
  ...Array.from(CHALLENGING_VOWELS),
  ...Array.from(CHALLENGING_CONSONANTS),
]);

/*
! Determines if a phoneme is considered "difficult" for learners
*/
export function isChallengingPhoneme(phoneme: string): boolean {
  return CHALLENGING_PHONEMES.has(phoneme);
}

/*
! Get difficulty level for a phoneme
*/
export function getPhonemeDifficulty(phoneme: string): 'easy' | 'medium' | 'hard' {
  const challengingVowels = ['æ', 'ʌ', 'ɔ', 'ɜ', 'eɪ', 'oʊ', 'aʊ', 'ɔɪ'];
  const challengingConsonants = ['θ', 'ð', 'ŋ', 'ʃ', 'ʒ', 'tʃ', 'dʒ', 'ɹ'];

  if (challengingConsonants.includes(phoneme)) return 'hard';
  if (challengingVowels.includes(phoneme)) return 'medium';
  return 'easy';
}

/*
! Converts stress marker to IPA stress symbol
*/
export function stressToIPA(stress: '0' | '1' | '2'): string {
  return ARPABET_TO_IPA[stress] || '';
}

/*
! Parse ARPABET string into array of phonemes with stress markers
? Input: "W AH1 D" -> Output: ["W", "AH", "1"]
*/
export function parseARPABET(arpabet: string): string[] {
  return arpabet.split(/\s+/).filter(Boolean);
}

/*
! Convert single ARPABET phoneme to IPA
*/
export function arpabetToIPA(phone: string): string {
  // Handle stress markers
  if (phone.match(/^[012]$/)) {
    return ARPABET_TO_IPA[phone] || '';
  }
  return ARPABET_TO_IPA[phone] || phone;
}

/*
! Convert full ARPABET sequence to IPA string
? Handles syllable breaks and stress markers
*/
export function arpabetSequenceToIPA(phones: string[]): string {
  let result = '';
  let inSyllable = false;

  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i];

    if (phone.match(/^[012]$/)) {
      // Stress marker
      if (phone === '1' && inSyllable) {
        result = result.replace(/ˌ$/, ''); // Replace secondary with primary
        result += 'ˈ';
      } else if (phone === '2' && inSyllable) {
        result += 'ˌ';
      } else if (phone === '0') {
        // No stress marker in output, but track it
      }
    } else {
      // Regular phoneme
      const ipa = arpabetToIPA(phone);
      result += ipa;
      inSyllable = true;

      // Add syllable break before stressed vowel
      if (phones[i + 1]?.match(/^[12]$/)) {
        // Will handle stress on next iteration
      }
    }
  }

  return result;
}
