/*
! TTS Playback Controls UI component.
! Allows user to control voice, rate, pitch, and volume.
*/

'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, ChevronDown, ChevronUp, Play, Square, Pause } from 'lucide-react';
import type { VoiceInfo, PlaybackSettings, PlaybackState } from '../types';

interface TTSControlsProps {
  text: string;
  state: PlaybackState;
  voices: VoiceInfo[];
  settings: PlaybackSettings;
  onSpeak: (text: string) => Promise<void>;
  onStop: () => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
  onVolumeChange: (volume: number) => void;
  onVoiceChange: (voice: VoiceInfo) => void;
  isSupported: boolean;
  className?: string;
}

export function TTSControls({
  text,
  state,
  voices,
  settings,
  onSpeak,
  onStop,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  onVoiceChange,
  isSupported,
  className = '',
}: TTSControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPlaying = state === 'playing';
  const isPaused = state === 'paused';

  if (!isSupported) {
    return null;
  }

  const selectedVoice = voices.find((v) => v.uri === settings.voiceURI);
  const displayVoice = selectedVoice?.name || 'Default';

  return (
    <div
      className={`tts-controls ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Main controls bar */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
        {/* Play button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            isPlaying ? onStop() : onSpeak(text);
          }}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          title={isPlaying ? 'Stop' : 'Play pronunciation'}
        >
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        {/* Current voice indicator */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-background hover:bg-background/80 transition-colors"
        >
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[120px] truncate">{displayVoice}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Quick settings */}
        <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
          <span>{settings.rate.toFixed(1)}x</span>
          <span>P: {settings.pitch.toFixed(1)}</span>
          <span>V: {Math.round(settings.volume * 100)}%</span>
        </div>
      </div>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="mt-2 p-4 rounded-lg border bg-background animate-in slide-in-from-top-2">
          {/* Voice selector */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Voice</label>
            <select
              value={settings.voiceURI || ''}
              onChange={(e) => {
                e.stopPropagation();
                const voice = voices.find((v) => v.uri === e.target.value);
                if (voice) onVoiceChange(voice);
              }}
              className="w-full p-2 rounded-md border bg-background"
            >
              <option value="">System Default</option>
              {voices.map((voice) => (
                <option key={voice.uri} value={voice.uri}>
                  {voice.name} {voice.localService ? '(Local)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Rate slider */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <label className="font-medium">Speed</label>
              <span className="font-mono">{settings.rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.rate}
              onChange={(e) => {
                e.stopPropagation();
                onRateChange(parseFloat(e.target.value));
              }}
              className="w-full h-2 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Pitch slider */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <label className="font-medium">Pitch</label>
              <span className="font-mono">{settings.pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => {
                e.stopPropagation();
                onPitchChange(parseFloat(e.target.value));
              }}
              className="w-full h-2 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Lower</span>
              <span>Higher</span>
            </div>
          </div>

          {/* Volume slider */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <label className="font-medium">Volume</label>
              <span className="font-mono">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => {
                e.stopPropagation();
                onVolumeChange(parseFloat(e.target.value));
              }}
              className="w-full h-2 rounded-full bg-secondary appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TTSControls;
