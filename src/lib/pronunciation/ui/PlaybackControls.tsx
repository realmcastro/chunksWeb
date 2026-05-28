/*
! PlaybackControls UI component.
! TTS playback controls with voice, rate, pitch, and volume settings.
*/

'use client';

import React from 'react';
import { Play, Pause, Square, Volume2, ChevronDown } from 'lucide-react';
import type { VoiceInfo, PlaybackSettings, PlaybackState, Locale } from '../types';

interface PlaybackControlsProps {
  text: string;
  state: PlaybackState;
  isSupported: boolean;
  voices: VoiceInfo[];
  settings: PlaybackSettings;
  locale: Locale;
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
! PlaybackControls provides TTS playback UI with all adjustment options
*/
export function PlaybackControls({
  text,
  state,
  isSupported,
  voices,
  settings,
  locale,
  onPlay,
  onStop,
  onPause,
  onResume,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  onVoiceChange,
  className = '',
}: PlaybackControlsProps) {
  const isPlaying = state === 'playing';
  const isPaused = state === 'paused';

  if (!isSupported) {
    return (
      <div className={`playback-controls ${className}`}>
        <div className="text-sm text-muted-foreground">
          Text-to-speech is not supported in this browser.
        </div>
      </div>
    );
  }

  const selectedVoice = voices.find((v) => v.uri === settings.voiceURI);
  const displayVoice = selectedVoice?.name || `Default (${locale})`;

  return (
    <div className={`playback-controls p-4 rounded-lg border ${className}`}>
      {/* Play/Pause/Stop buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={isPlaying ? onPause : isPaused ? onResume : onPlay}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={!text}
          title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        <button
          onClick={onStop}
          className="p-2 rounded-full border hover:bg-muted"
          disabled={!isPlaying && !isPaused}
          title="Stop"
        >
          <Square className="h-5 w-5" />
        </button>

        {/* Voice selector */}
        <div className="relative ml-auto">
          <select
            value={settings.voiceURI || ''}
            onChange={(e) => {
              const voice = voices.find((v) => v.uri === e.target.value);
              if (voice) onVoiceChange(voice);
            }}
            className="appearance-none pl-3 pr-8 py-2 rounded-full border text-sm bg-background cursor-pointer"
          >
            <option value="">Default</option>
            {voices.map((voice) => (
              <option key={voice.uri} value={voice.uri}>
                {voice.name} {voice.localService ? '(Local)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
        </div>
      </div>

      {/* Rate slider */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <label className="text-muted-foreground">Speed</label>
          <span className="font-mono">{settings.rate.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={settings.rate}
          onChange={(e) => onRateChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer"
        />
      </div>

      {/* Pitch slider */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <label className="text-muted-foreground">Pitch</label>
          <span className="font-mono">{settings.pitch.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          value={settings.pitch}
          onChange={(e) => onPitchChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer"
        />
      </div>

      {/* Volume slider */}
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <label className="text-muted-foreground flex items-center gap-1">
            <Volume2 className="h-4 w-4" />
            Volume
          </label>
          <span className="font-mono">{Math.round(settings.volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

export default PlaybackControls;
