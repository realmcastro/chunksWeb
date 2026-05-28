/*
! Public API exports for the pronunciation system (client-safe subset).
? Only exports modules that work in the browser environment.
*/

// Types
export * from './types';

// Engines - IPA (client-safe)
export * from './engines/ipa/IPAConverter';
export * from './engines/ipa/arpabetToIPAMap';

// TTS Client (client-safe)
export * from './services/TTSCoordinatorClient';

// UI Components
export { PhonemeDisplay } from './ui/PhonemeDisplay';
export { PlaybackControls } from './ui/PlaybackControls';
export { IPAVisualizer } from './ui/IPAVisualizer';
export { PronunciationPanel } from './ui/PronunciationPanel';
export { TTSControls } from './ui/TTSControls';

// Hooks - Client-safe versions only
export { usePronunciation, usePronunciationPrefetch } from './hooks/usePronunciationClient';
export { useTTSPlaybackClient } from './hooks/useTTSPlaybackClient';
