/*
! PhonemeDisplay UI component.
! Shows IPA transcription with difficulty highlighting.
*/

'use client';

import React from 'react';
import type { PhonemeData, DifficultyLevel } from '../types';

interface PhonemeDisplayProps {
  data: PhonemeData | null;
  isLoading?: boolean;
  showDifficulty?: boolean;
  className?: string;
}

/*
! Difficulty color mapping
*/
const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: '#22c55e', // green
  medium: '#eab308', // yellow
  hard: '#ef4444', // red
};

/*
! PhonemeDisplay shows phonetic transcription with highlighted difficult sounds
*/
export function PhonemeDisplay({
  data,
  isLoading = false,
  showDifficulty = true,
  className = '',
}: PhonemeDisplayProps) {
  if (isLoading) {
    return (
      <div className={`phoneme-display ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-6 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`phoneme-display empty ${className}`}>
        <span className="text-muted-foreground text-sm">No pronunciation data</span>
      </div>
    );
  }

  return (
    <div className={`phoneme-display ${className}`}>
      {/* Main IPA display */}
      <div className="flex flex-wrap gap-1 mb-3">
        {data.segments.map((segment, index) => {
          const style =
            showDifficulty && segment.isChallenging
              ? { color: DIFFICULTY_COLORS[segment.difficulty] }
              : undefined;

          return (
            <span
              key={index}
              className={`phoneme-segment ${segment.isChallenging ? 'challenging' : ''} ${segment.difficulty}`}
              style={style}
              title={segment.isChallenging ? `${segment.difficulty} difficulty` : 'easy'}
            >
              {segment.ipa}
            </span>
          );
        })}
      </div>

      {/* Full IPA transcription */}
      <div className="text-sm text-muted-foreground">
        <span className="font-mono">{data.ipa}</span>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
        <span>{data.wordCount} words</span>
        <span>{data.syllableCount} syllables</span>
        {data.fromCache && <span className="text-green-600">cached</span>}
      </div>
    </div>
  );
}

export default PhonemeDisplay;
