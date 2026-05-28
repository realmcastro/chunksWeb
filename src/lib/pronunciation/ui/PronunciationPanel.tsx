/*
! Pronunciation Panel component.
! Integrated pronunciation display and playback UI for card study.
*/

'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';
import type { PhonemeData, Locale, VoiceInfo, PlaybackSettings, PlaybackState } from '../types';
import { PhonemeDisplay } from './PhonemeDisplay';
import { PlaybackControls } from './PlaybackControls';
import { IPAVisualizer } from './IPAVisualizer';

interface PronunciationPanelProps {
  chunkText: string;
  phonemeData: PhonemeData | null;
  isLoading: boolean;
  locale: Locale;
  playbackState: PlaybackState;
  isSupported: boolean;
  voices: VoiceInfo[];
  settings: PlaybackSettings;
  onPlay: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
  onVolumeChange: (volume: number) => void;
  onVoiceChange: (voice: VoiceInfo) => void;
  className?: string;
}

/*
! PronunciationPanel combines phoneme display with playback controls
*/
export function PronunciationPanel({
  chunkText,
  phonemeData,
  isLoading,
  locale,
  playbackState,
  isSupported,
  voices,
  settings,
  onPlay,
  onStop,
  onPause,
  onResume,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  onVoiceChange,
  className = '',
}: PronunciationPanelProps) {
  return (
    <div className={`pronunciation-panel ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Pronunciation</h3>
        <span className="text-xs text-muted-foreground ml-auto">{locale}</span>
      </div>

      {/* IPA Display */}
      <div className="mb-4">
        <PhonemeDisplay data={phonemeData} isLoading={isLoading} showDifficulty={true} />
      </div>

      {/* Detailed IPA Visualizer */}
      {phonemeData && (
        <div className="mb-4">
          <IPAVisualizer data={phonemeData} />
        </div>
      )}

      {/* Playback Controls */}
      <PlaybackControls
        text={chunkText}
        state={playbackState}
        isSupported={isSupported}
        voices={voices}
        settings={settings}
        locale={locale}
        onPlay={onPlay}
        onStop={onStop}
        onPause={onPause}
        onResume={onResume}
        onRateChange={onRateChange}
        onPitchChange={onPitchChange}
        onVolumeChange={onVolumeChange}
        onVoiceChange={onVoiceChange}
      />
    </div>
  );
}

export default PronunciationPanel;
