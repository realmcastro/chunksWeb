/*
! IPA Visualizer component.
! Shows word-aligned IPA transcription with click-to-hear functionality.
*/

'use client';

import React from 'react';
import type { PhonemeData } from '../types';

interface IPAVisualizerProps {
  data: PhonemeData | null;
  onPhonemeClick?: (phoneme: string, index: number) => void;
  highlightChallenging?: boolean;
  className?: string;
}

/*
! IPAVisualizer displays IPA transcription aligned with original words
*/
export function IPAVisualizer({
  data,
  onPhonemeClick,
  highlightChallenging = true,
  className = '',
}: IPAVisualizerProps) {
  if (!data) {
    return (
      <div className={`ipa-visualizer empty ${className}`}>
        <span className="text-muted-foreground text-sm">No IPA data available</span>
      </div>
    );
  }

  // Group segments by word
  const words = data.originalText.split(/\s+/);
  const segmentsByWord: Array<{ word: string; ipa: string; isChallenging: boolean }> = [];

  let charPos = 0;
  for (const word of words) {
    const wordStart = data.originalText.indexOf(word, charPos);
    if (wordStart === -1) continue;

    const wordSegments = data.segments.filter(
      (s) => s.startChar >= wordStart && s.endChar <= wordStart + word.length,
    );

    const ipa = wordSegments.map((s) => s.ipa).join('');
    const isChallenging = wordSegments.some((s) => s.isChallenging);

    segmentsByWord.push({ word, ipa, isChallenging });
    charPos = wordStart + word.length;
  }

  return (
    <div className={`ipa-visualizer ${className}`}>
      {/* IPA with word alignment */}
      <div className="flex flex-wrap gap-2">
        {segmentsByWord.map((wordData, wordIndex) => (
          <div
            key={wordIndex}
            className={`word-group ${wordData.isChallenging && highlightChallenging ? 'challenging' : ''}`}
          >
            <span className="word-text font-medium">{wordData.word}</span>
            <span className="word-ipa text-muted-foreground">/{wordData.ipa}/</span>
          </div>
        ))}
      </div>

      {/* Full transcription with syllable markers */}
      <div className="mt-3 pt-3 border-t">
        <div className="font-mono text-lg">{data.ipa}</div>
        {data.arpabet && (
          <div className="text-sm text-muted-foreground mt-1">ARPABET: {data.arpabet}</div>
        )}
      </div>
    </div>
  );
}

export default IPAVisualizer;
