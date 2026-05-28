/*
! Phoneme highlighter service.
! Maps phonemes to text positions for visual highlighting.
*/

import type { PhonemeSegment, DifficultyLevel } from '../types';
import { CHALLENGING_PHONEMES, getPhonemeDifficulty } from '../engines/ipa/arpabetToIPAMap';

/*
! Result of highlighting operation
*/
export interface HighlightedText {
  segments: HighlightedSegment[];
  html: string; // Pre-rendered HTML for display
}

export interface HighlightedSegment {
  text: string;
  ipa: string;
  phoneme: string;
  startChar: number;
  endChar: number;
  difficulty: DifficultyLevel;
  isChallenging: boolean;
}

/*
! Configuration for highlighting
*/
export interface HighlighterConfig {
  highlightChallenging: boolean;
  difficultyColors: Record<DifficultyLevel, string>;
  showIPA: boolean;
  showDifficulty: boolean;
}

/*
! Default highlighting configuration
*/
export const DEFAULT_HIGHLIGHTER_CONFIG: HighlighterConfig = {
  highlightChallenging: true,
  difficultyColors: {
    easy: '#22c55e', // green
    medium: '#eab308', // yellow
    hard: '#ef4444', // red
  },
  showIPA: true,
  showDifficulty: true,
};

/*
! PhonemeHighlighterService maps phonemes to text and generates highlighted output
*/
export class PhonemeHighlighterService {
  private config: HighlighterConfig;

  constructor(config: Partial<HighlighterConfig> = {}) {
    this.config = { ...DEFAULT_HIGHLIGHTER_CONFIG, ...config };
  }

  /*
  ! Update configuration
  */
  configure(config: Partial<HighlighterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /*
  ! Process segments and create highlighted text segments
  */
  processSegments(segments: PhonemeSegment[]): HighlightedSegment[] {
    return segments.map((segment) => ({
      text: segment.phoneme,
      ipa: segment.ipa,
      phoneme: segment.phoneme,
      startChar: segment.startChar,
      endChar: segment.endChar,
      difficulty: segment.difficulty,
      isChallenging: segment.isChallenging,
    }));
  }

  /*
  ! Generate highlighted HTML from segments
  ! @param originalText - Original text to highlight within
  ! @param segments - Phoneme segments with positions
  */
  generateHighlightedHTML(originalText: string, segments: PhonemeSegment[]): string {
    if (segments.length === 0) {
      return `<span class="phoneme-text">${this.escapeHTML(originalText)}</span>`;
    }

    // Sort segments by start position
    const sorted = [...segments].sort((a, b) => a.startChar - b.startChar);
    let result = '';
    let lastEnd = 0;

    for (const segment of sorted) {
      // Add any text before this segment
      if (segment.startChar > lastEnd) {
        result += `<span class="phoneme-text">${this.escapeHTML(originalText.slice(lastEnd, segment.startChar))}</span>`;
      }

      // Add the highlighted phoneme
      const color =
        this.config.highlightChallenging && segment.isChallenging
          ? this.config.difficultyColors[segment.difficulty]
          : undefined;

      const style = color ? ` style="color: ${color}"` : '';
      const className = `phoneme-segment ${segment.isChallenging ? 'challenging' : ''} ${segment.difficulty}`;

      result += `<span class="${className}"${style}>${this.escapeHTML(segment.phoneme)}</span>`;

      lastEnd = segment.endChar;
    }

    // Add any remaining text
    if (lastEnd < originalText.length) {
      result += `<span class="phoneme-text">${this.escapeHTML(originalText.slice(lastEnd))}</span>`;
    }

    return result;
  }

  /*
  ! Get phonemes grouped by word
  */
  groupByWord(
    originalText: string,
    segments: PhonemeSegment[],
  ): Array<{ word: string; ipa: string; segments: PhonemeSegment[]; isChallenging: boolean }> {
    const words = originalText.split(/\s+/);
    const result: Array<{
      word: string;
      ipa: string;
      segments: PhonemeSegment[];
      isChallenging: boolean;
    }> = [];

    let charPos = 0;

    for (const word of words) {
      const wordStart = originalText.indexOf(word, charPos);
      if (wordStart === -1) continue;

      const wordSegments = segments.filter(
        (s) => s.startChar >= wordStart && s.endChar <= wordStart + word.length,
      );

      if (wordSegments.length > 0) {
        const isChallenging = wordSegments.some((s) => s.isChallenging);

        result.push({
          word,
          ipa: wordSegments.map((s) => s.ipa).join(' '),
          segments: wordSegments,
          isChallenging,
        });
      }

      charPos = wordStart + word.length;
    }

    return result;
  }

  /*
  ! Calculate overall text difficulty based on segment difficulties
  */
  calculateTextDifficulty(segments: PhonemeSegment[]): {
    overall: DifficultyLevel;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    challengingPercentage: number;
  } {
    const counts = { easy: 0, medium: 0, hard: 0 };
    const challengingCount = segments.filter((s) => s.isChallenging).length;

    for (const segment of segments) {
      counts[segment.difficulty]++;
    }

    const total = segments.length || 1;

    return {
      overall: counts.hard > 0 ? 'hard' : counts.medium > 0 ? 'medium' : 'easy',
      easyCount: counts.easy,
      mediumCount: counts.medium,
      hardCount: counts.hard,
      challengingPercentage: Math.round((challengingCount / total) * 100),
    };
  }

  /*
  ! Escape HTML special characters
  */
  private escapeHTML(text: string): string {
    return text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
  }
}

/*
! Singleton instance
*/
let highlighterInstance: PhonemeHighlighterService | null = null;

export function getPhonemeHighlighter(
  config?: Partial<HighlighterConfig>,
): PhonemeHighlighterService {
  if (!highlighterInstance) {
    highlighterInstance = new PhonemeHighlighterService(config);
  } else if (config) {
    highlighterInstance.configure(config);
  }
  return highlighterInstance;
}
