# Advanced Pronunciation System - Technical Implementation Plan

## 1. Executive Summary

This plan outlines a fully offline, local-first pronunciation system for the ChunksWeb language learning application. The system provides IPA transcription, phoneme highlighting, and Text-to-Speech (TTS) playback during card study sessions without relying on external APIs, cloud services, or ML Kit.

**Key Constraints:**

- No external TTS/G2P APIs
- No cloud dependencies
- No ML Kit
- No IndexedDB (SQLite only)
- Cross-platform support (Web-based)

**Languages Supported (Phase 1):**

- English: en-US, en-GB, en-CA, en-AU
- French: fr-FR, fr-CA

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRONUNCIATION SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │   UI LAYER       │  │  CARD INTEGRATION│  │  SETTINGS MANAGER    │  │
│  │  PhonemeDisplay  │  │                  │  │  VoiceSettings       │  │
│  │  PlaybackControls │  │  ChunkDetailCard │  │  PronunciationPrefs  │  │
│  │  IPAVisualizer   │  │                  │  │                      │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬──────────┘  │
│           │                     │                        │             │
│  ┌────────▼─────────────────────▼────────────────────────▼──────────┐  │
│  │                      SERVICE LAYER                               │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐   │  │
│  │  │ Pronunciation  │  │  TTS Engine    │  │  Phoneme Highlighter│  │  │
│  │  │ Service        │  │  Coordinator   │  │  Service            │   │  │
│  │  │ (G2P + Cache)  │  │                │  │                    │   │  │
│  │  └───────┬────────┘  └───────┬────────┘  └─────────┬──────────┘   │  │
│  │          │                   │                     │               │  │
│  └──────────┼───────────────────┼─────────────────────┼───────────────┘  │
│             │                   │                     │                │
│  ┌──────────▼───────────────────▼─────────────────────▼───────────────┐  │
│  │                      ENGINE LAYER                                 │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │  │
│  │  │  G2P Engine    │  │  IPA Converter │  │  TTS Engine        │    │  │
│  │  │  (local libs)  │  │  (ESpeak→IPA)  │  │  (Web Speech API) │    │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────┘    │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│             │                   │                     │                │
│  ┌──────────▼───────────────────▼─────────────────────▼───────────────┐  │
│  │                      STORAGE LAYER (SQLite)                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │  phonetic_cache  │  voice_preferences  │  tts_settings     │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module Responsibilities

### 3.1 Engine Layer

| Module           | Responsibility                                | Technology                                                                                                                                                 | File Location                |
| ---------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **G2PEngine**    | Grapheme-to-Phoneme conversion                | [`speech-rule-engine`](https://github.com/zhouxiinayan/speech-rule-engine) for English, [`epitran`](https://github.com/dmort27/epitran) for cross-language | `src/lib/pronunciation/g2p/` |
| **IPAConverter** | Convert ARPABET/other phonetic formats to IPA | [`espeakjs`](https://github.com/j主/espeakjs) + custom mapping tables                                                                                      | `src/lib/pronunciation/ipa/` |
| **TTSEngine**    | Local speech synthesis via Web Speech API     | Web Speech API (`speechSynthesis`)                                                                                                                         | `src/lib/pronunciation/tts/` |

### 3.2 Service Layer

| Module                        | Responsibility                                       | Public API                                                     |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| **PronunciationService**      | Orchestrates G2P + caching, returns phoneme data     | `getPhonemes(text, locale): Promise<PhonemeData>`              |
| **TTSCoordinator**            | Manages playback, voice selection, rate/pitch/volume | `speak(text, settings): void`, `pause()`, `resume()`, `stop()` |
| **PhonemeHighlighterService** | Maps phonemes to text positions for highlighting     | `getHighlightedText(text, phonemes): HighlightedSegment[]`     |

### 3.3 Storage Layer (SQLite)

| Table               | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `phonetic_cache`    | Stores pre-computed IPA/ARPABET transcriptions        |
| `voice_preferences` | User's voice settings per locale                      |
| `tts_settings`      | Global TTS preferences (rate, pitch, volume defaults) |

---

## 4. Library Recommendations

### 4.1 G2P (Grapheme-to-Phoneme)

| Language      | Library                                                                                | Rationale                                                          |
| ------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **English**   | [`speech-rule-engine`](https://github.com/zhouxiinayan/speech-rule-engine) (CMU-based) | Uses CMU Pronouncing Dictionary, high accuracy for English, mature |
| **English**   | [`pronunciation`](https://github.com/subPodeśian/pronunciation) (alternative)          | ARPABET output, smaller bundle                                     |
| **French**    | [`epitran`](https://github.com/dmort27/epitran)                                        | Language-agnostic, supports French with IPA output                 |
| **Universal** | [`phonetics-js`](https://github.com/phonetics-js/phonetics-js)                         | Dictionary-based lookup for common words                           |

**Decision:** Use `speech-rule-engine` for English (best accuracy), `epitran` for French.

### 4.2 IPA Transcription

| Library                                       | Rationale                                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`espeakjs`](https://github.com/j主/espeakjs) | Converts text→IPA, runs entirely in browser, supports 30+ languages                           |
| **Custom ARPABET→IPA mapping**                | For SRE output, use lookup table: [ARPABET to IPA](https://en.wikipedia.org/wiki/ARPABET#Key) |

### 4.3 TTS (Text-to-Speech)

| Engine                                 | Priority | Rationale                                                     |
| -------------------------------------- | -------- | ------------------------------------------------------------- |
| **Web Speech API** (`speechSynthesis`) | Primary  | Native browser API, uses OS-installed voices, offline-capable |
| **espeakjs**                           | Fallback | Browser-based TTS engine, works when Web Speech unavailable   |
| **Platform TTS** (native bridge)       | Future   | Native voice quality via Capacitor/Cordova                    |

**Critical Note:** Web Speech API voices are device-dependent. Fallback chain is mandatory.

---

## 5. SQLite Data Model

### 5.1 Table: `phonetic_cache`

```sql
CREATE TABLE phonetic_cache (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  text            TEXT NOT NULL,
  locale          TEXT NOT NULL,           -- 'en-US', 'fr-FR', etc.
  ipa_transcript  TEXT,                    -- /ˈtʃʌŋk/
  arpabet_transcript TEXT,                 -- CH AH NG K
  phoneme_data    TEXT,                    -- JSON: [{phoneme: 'tʃ', start: 0, end: 1}, ...]
  difficulty_mask TEXT,                    -- JSON: [true, false, true, ...] (challenging phonemes)
  text_hash       TEXT NOT NULL,           -- SHA256(text + locale)
  created_at      INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at      INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(text, locale)
);

CREATE INDEX idx_phonetic_cache_hash ON phonetic_cache(text_hash);
CREATE INDEX idx_phonetic_cache_locale ON phonetic_cache(locale);
```

### 5.2 Table: `voice_preferences`

```sql
CREATE TABLE voice_preferences (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL DEFAULT 1,
  locale      TEXT NOT NULL,               -- 'en-US', 'fr-FR'
  voice_uri   TEXT,                        -- Web Speech API voice identifier
  voice_name  TEXT,                        -- Human-readable name
  rate        REAL DEFAULT 1.0,            -- 0.1 to 10.0
  pitch       REAL DEFAULT 1.0,             -- 0.0 to 2.0
  volume      REAL DEFAULT 1.0,            -- 0.0 to 1.0
  created_at  INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at  INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, locale)
);

CREATE INDEX idx_voice_prefs_user_locale ON voice_preferences(user_id, locale);
```

### 5.3 Table: `tts_settings`

```sql
CREATE TABLE tts_settings (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL DEFAULT 1,
  default_rate      REAL DEFAULT 0.9,
  default_pitch     REAL DEFAULT 1.0,
  default_volume    REAL DEFAULT 1.0,
  auto_play         INTEGER DEFAULT 0,    -- 0: off, 1: on
  highlight_phonemes INTEGER DEFAULT 1,    -- 0: off, 1: on
  playback_mode     TEXT DEFAULT 'sequential', -- 'sequential' | 'segmented'
  created_at        INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at        INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id)
);
```

---

## 6. Cache Policy

### 6.1 Strategy

| Cache State | Behavior                                                                  |
| ----------- | ------------------------------------------------------------------------- |
| **HIT**     | Text + locale found in SQLite → Return cached IPA immediately             |
| **MISS**    | Not in cache → G2P conversion → IPA conversion → Store in SQLite → Return |
| **STALE**   | Cache entry > 30 days old → Background refresh on idle                    |

### 6.2 Invalidation Rules

1. **Manual invalidation:** User clears cache via settings
2. **Locale change:** Invalidate all entries for changed locale
3. **Library update:** Clear entire cache (versioned in `metadata` table)
4. **Storage pressure:** LRU eviction when SQLite file > 50MB (configurable)

### 6.3 Pre-computation

| Phase            | Action                                                      |
| ---------------- | ----------------------------------------------------------- |
| **Build time**   | Pre-compute IPA for top 500 most frequent chunks per locale |
| **First launch** | Silent background cache warm-up for user's study language   |
| **Idle time**    | Progressive cache population during low-activity periods    |

---

## 7. Fallback Strategy for Voice Availability

### 7.1 Voice Availability Detection

```typescript
/*
! Voice availability check - must run after user interaction (browser requirement)
? Returns voices matching locale, sorted by preference score
*/
function getAvailableVoices(locale: Locale): SpeechSynthesisVoice[] {
  const voices = speechSynthesis.getVoices();
  return voices
    .filter((v) => v.lang.startsWith(locale.split('-')[0])) // Language match
    .sort((a, b) => {
      // Prefer local voices over remote
      if (a.localService && !b.localService) return -1;
      if (!a.localService && b.localService) return 1;
      // Prefer exact locale match
      if (a.lang === locale && b.lang !== locale) return -1;
      if (a.lang !== locale && b.lang === locale) return 1;
      // Prefer voice name containing preferred keywords
      const prefs = ['Premium', 'Enhanced', 'Natural', 'Standard'];
      const scoreA = prefs.findIndex((p) => a.name.includes(p));
      const scoreB = prefs.findIndex((p) => b.name.includes(p));
      return scoreA - scoreB;
    });
}
```

### 7.2 Fallback Chain

```
PRIMARY:    User-selected voice for locale
     ↓ (if unavailable)
FALLBACK 1: Best available local voice for locale
     ↓ (if none)
FALLBACK 2: Best available remote voice for locale
     ↓ (if none)
FALLBACK 3: Default en-US / fr-FR voice (any)
     ↓ (if none)
FALLBACK 4: espeakjs synthetic voice
     ↓ (if fails)
ERROR:      Display "Voice unavailable" with text-only mode
```

### 7.3 Voice Preference Matching

| Locale | Preferred Voice Patterns                  |
| ------ | ----------------------------------------- |
| en-US  | "US", "American", "English United States" |
| en-GB  | "GB", "British", "English United Kingdom" |
| en-AU  | "AU", "Australian"                        |
| en-CA  | "CA", "Canadian"                          |
| fr-FR  | "FR", "French", "France"                  |
| fr-CA  | "CA", "Canadian French", "Québec"         |

---

## 8. Performance Optimization

### 8.1 Latency Targets

| Operation                | Target  | Maximum |
| ------------------------ | ------- | ------- |
| Card open → IPA display  | < 50ms  | 200ms   |
| Cache HIT retrieval      | < 10ms  | 30ms    |
| Cache MISS (G2P + IPA)   | < 500ms | 1000ms  |
| TTS start                | < 100ms | 300ms   |
| Phoneme highlight render | < 16ms  | 50ms    |

### 8.2 Optimization Strategies

| Strategy                  | Implementation                                                 |
| ------------------------- | -------------------------------------------------------------- |
| **Memory caching**        | LRU cache for hot phoneme data (max 100 entries)               |
| **Web Worker**            | G2P conversion off main thread to prevent UI blocking          |
| **Lazy loading**          | Load G2P engines only when pronunciation requested             |
| **Indexed lookups**       | SHA256 hash index on `phonetic_cache` for O(1) cache checks    |
| **Virtualized rendering** | Only render visible phoneme highlights in scrollable lists     |
| **TTS voice preloading**  | Pre-load voice list on app init (after first user interaction) |

### 8.3 Bundle Optimization

| Library              | Technique                               |
| -------------------- | --------------------------------------- |
| `speech-rule-engine` | Dynamic import, only load English rules |
| `epitran`            | Tree-shake unused language modules      |
| `espeakjs`           | Load only required language voice data  |

---

## 9. UI Components

### 9.1 PhonemeDisplay

```
┌────────────────────────────────────────────┐
│  "Would you like a cup of tea?"            │
│   [wʊd] [juː] [laɪk] [ə] [kʌp] [əv] [tiː] │
│   └──▲────▲────────────────▲──────────▲──  │  (▲ = highlighted difficult phoneme)
└────────────────────────────────────────────┘
```

**Features:**

- IPA transcription displayed as phonetic segments
- Difficult phonemes highlighted with accent color
- Click on phoneme to hear isolated pronunciation
- Toggle between IPA / ARPABET display

### 9.2 PlaybackControls

```
┌──────────────────────────────────────────────────┐
│  ▶ PLAY  │  ━━━●━━━━  0.9x  │  ♪ ♪♫  │  EN-US ▼ │
└──────────────────────────────────────────────────┘
```

**Controls:**

- **Play/Pause/Stop:** Basic playback control
- **Speed slider:** 0.5x to 2.0x (step 0.1)
- **Pitch slider:** 0.5x to 1.5x (step 0.1)
- **Volume slider:** 0% to 100%
- **Voice selector:** Dropdown with available voices for locale
- **Locale display:** Shows current language variant

### 9.3 IPAVisualizer

```
┌────────────────────────────────────────────┐
│  /wʊd juː laɪk ə kʌp əv tiː/              │
│   └───┘ └───┘ └─┘ └┘ └──┘ └──┘           │
│   Would   you  like  a  cup   of  tea     │
└────────────────────────────────────────────┘
```

**Features:**

- Full IPA transcription with word alignment
- Syllable breaks marked (ˌ for secondary stress)
- Click-to-hear word or phoneme
- Export as audio (future)

---

## 10. Future Expansion: Pronunciation Evaluation

### 10.1 Roadmap for Evaluation Module

| Phase       | Feature                    | Technical Approach                           |
| ----------- | -------------------------- | -------------------------------------------- |
| **Phase 3** | **Recording capture**      | MediaRecorder API + AudioContext             |
| **Phase 3** | **Waveform visualization** | Web Audio API (AnalyserNode)                 |
| **Phase 4** | **Phoneme comparison**     | DTW (Dynamic Time Warping) on MFCC features  |
| **Phase 4** | **Similarity scoring**     | Cosine similarity on phoneme embeddings      |
| **Phase 5** | **Visual feedback**        | Overlay correct vs. attempted phoneme timing |
| **Phase 5** | **Adaptive practice**      | SM-2 integration for pronunciation mastery   |

### 10.2 Evaluation Data Model

```sql
-- Recording storage (blob references, not stored in SQLite)
CREATE TABLE pronunciation_recordings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL DEFAULT 1,
  chunk_id        INTEGER NOT NULL,
  recording_path  TEXT,                    -- File system path or Blob URL
  duration_ms     INTEGER,
  quality_score   REAL,                    -- 0.0 to 1.0
  phoneme_scores  TEXT,                    -- JSON: [{phoneme, score, start, end}]
  created_at      INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (chunk_id) REFERENCES chunks(id)
);
```

### 10.3 Architectural Considerations for Evaluation

1. **Processing location:** MFCC/DTW runs in Web Worker to avoid UI blocking
2. **Storage:** Recordings stored in file system, references in SQLite
3. **Feedback timing:** Target < 2 seconds from recording end to feedback display
4. **Privacy:** All processing local, no audio upload to any server

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

| Task                           | Deliverable                                           |
| ------------------------------ | ----------------------------------------------------- |
| Set up SQLite tables           | `phonetic_cache`, `voice_preferences`, `tts_settings` |
| Implement G2PEngine interface  | Abstract interface supporting multiple G2P backends   |
| Integrate `speech-rule-engine` | English G2P with ARPABET output                       |
| Integrate `epitran`            | French G2P with IPA output                            |
| Create `IPAConverter` module   | ARPABET→IPA mapping table                             |
| Basic TTS integration          | Web Speech API with fallback chain                    |
| Unit tests for G2P engines     | >80% coverage on conversion accuracy                  |

### Phase 2: Core Features (Weeks 3-4)

| Task                             | Deliverable                                 |
| -------------------------------- | ------------------------------------------- |
| `PronunciationService`           | Orchestration layer with caching            |
| `TTSCoordinator`                 | Voice selection, rate/pitch/volume controls |
| `PhonemeHighlighterService`      | Text-to-phoneme mapping for highlighting    |
| UI: `PhonemeDisplay` component   | IPA display with difficulty highlighting    |
| UI: `PlaybackControls` component | Full playback control panel                 |
| Settings persistence             | User voice preferences in SQLite            |
| Pre-computation script           | Batch generate IPA for top 500 chunks       |

### Phase 3: Polish & Offline (Weeks 5-6)

| Task                       | Deliverable                                  |
| -------------------------- | -------------------------------------------- |
| Web Worker for G2P         | Non-blocking phoneme generation              |
| Service Worker integration | Offline cache for pronunciation assets       |
| LRU memory cache           | In-memory cache layer for hot data           |
| Voice preloading           | Pre-load voices after first user interaction |
| Performance profiling      | Latency verification against targets         |
| Bundle optimization        | Tree-shaking and lazy loading                |

### Phase 4: Evaluation Foundation (Weeks 7-8)

| Task                               | Deliverable                             |
| ---------------------------------- | --------------------------------------- |
| Audio recording capture            | MediaRecorder API integration           |
| Waveform visualization             | Audio visualizer component              |
| `PronunciationEvaluator` interface | Abstract interface for scoring backends |
| Basic similarity scoring           | MFCC-based comparison (placeholder)     |

### Phase 5: Advanced Evaluation (Weeks 9-10)

| Task                              | Deliverable                              |
| --------------------------------- | ---------------------------------------- |
| DTW phoneme alignment             | Dynamic Time Warping implementation      |
| Visual feedback overlay           | Correct vs. attempted phoneme display    |
| Pronunciation mastery tracking    | SM-2 integration                         |
| Adaptive practice recommendations | Spaced repetition for difficult phonemes |

---

## 12. Error Handling

### 12.1 Error States

| Error Condition      | User Feedback                                                                                 | Recovery Action           |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| No voices available  | "No voices installed for this language. Please install a voice pack in your device settings." | Show text-only mode       |
| G2P conversion fails | "Pronunciation data unavailable for this text."                                               | Display raw text          |
| TTS playback fails   | "Unable to play audio. Please try again."                                                     | Retry with fallback voice |
| Cache write fails    | Silent retry (3x), then log error                                                             | Use in-memory only        |
| SQLite unavailable   | "Local storage unavailable. Some features may be limited."                                    | Continue without cache    |

### 12.2 Voice Unavailability Detection

```typescript
/*
! Voice availability check returns structured result with fallback recommendation
*/
interface VoiceCheckResult {
  available: boolean;
  voices: SpeechSynthesisVoice[];
  recommendedFallback: {
    locale: Locale;
    reason: string;
  } | null;
}

/*
? Validates voice availability before attempting playback
? Prevents user-facing errors by detecting issues early
*/
async function validateVoiceAvailability(locale: Locale): Promise<VoiceCheckResult> {
  const voices = getAvailableVoices(locale);

  if (voices.length > 0) {
    return { available: true, voices, recommendedFallback: null };
  }

  // Try parent locale (e.g., en-US → en)
  const parentLocale = locale.split('-')[0];
  const parentVoices = getAvailableVoices(parentLocale as Locale);

  if (parentVoices.length > 0) {
    return {
      available: false,
      voices: parentVoices,
      recommendedFallback: {
        locale: parentLocale as Locale,
        reason: `No voices for ${locale}, using ${parentLocale} fallback`,
      },
    };
  }

  return {
    available: false,
    voices: [],
    recommendedFallback: null,
  };
}
```

---

## 13. File Structure

```
src/lib/pronunciation/
├── index.ts                          # Public API exports
├── engines/
│   ├── g2p/
│   │   ├── G2PEngine.ts              # Abstract interface
│   │   ├── SREG2PEngine.ts          # Speech-rule-engine implementation
│   │   ├── EpitranG2PEngine.ts      # Epitran implementation
│   │   └── types.ts                 # G2P types (ARPABET, phoneme data)
│   ├── ipa/
│   │   ├── IPAConverter.ts          # ARPABET→IPA conversion
│   │   ├── arpabetToIPAMap.ts       # Mapping table
│   │   └── stressPatterns.ts        # English stress rule patterns
│   └── tts/
│       ├── TTSEngine.ts             # Web Speech API wrapper
│       ├── ESpeakTTSEngine.ts       # Fallback espeakjs engine
│       └── voiceRegistry.ts         # Voice discovery and caching
├── services/
│   ├── PronunciationService.ts       # G2P orchestration + cache
│   ├── TTSCoordinator.ts           # Playback control + settings
│   ├── PhonemeHighlighterService.ts # Visual highlighting logic
│   └── VoicePreferenceService.ts    # User voice settings
├── storage/
│   ├── phoneticCache.ts             # SQLite cache operations
│   ├── voicePrefsStorage.ts          # Voice preferences CRUD
│   └── ttsSettingsStorage.ts        # TTS settings CRUD
├── ui/
│   ├── PhonemeDisplay.tsx           # IPA display component
│   ├── PlaybackControls.tsx         # TTS control panel
│   └── IPAVisualizer.tsx            # Word-aligned IPA display
├── workers/
│   └── g2pWorker.ts                 # Web Worker for G2P
├── hooks/
│   ├── usePronunciation.ts          # Card pronunciation hook
│   ├── useTTSPlayback.ts            # TTS controls hook
│   └── useVoiceSettings.ts          # Voice preferences hook
└── utils/
    ├── phonemeDifficulty.ts        # Difficulty scoring
    ├── localeUtils.ts               # Locale normalization
    └── cacheUtils.ts               # Hash generation, LRU logic
```

---

## 14. API Design

### 14.1 Core Pronunciation API

```typescript
// src/lib/pronunciation/index.ts

export interface PhonemeData {
  text: string;
  locale: Locale;
  ipa: string; // /ˈtʃʌŋk/
  arpabet: string; // CH AH NG K
  segments: PhonemeSegment[]; // [{phoneme: 'tʃ', start: 0, end: 1, difficulty: 'hard'}, ...]
  createdAt: number;
}

export interface PhonemeSegment {
  phoneme: string;
  startChar: number; // Character position in original text
  endChar: number;
  ipa: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PlaybackSettings {
  voiceURI?: string;
  rate: number; // 0.1 to 10.0
  pitch: number; // 0.0 to 2.0
  volume: number; // 0.0 to 1.0
}

/*
! Main entry point for pronunciation data retrieval
@param text - chunk text to phonetically analyze
@param locale - language locale (en-US, fr-FR, etc.)
@returns PhonemeData with IPA, ARPABET, and segment info
*/
export async function getPronunciation(text: string, locale: Locale): Promise<PhonemeData>;

/*
! TTS playback control
@param text - text to speak
@param settings - playback parameters
*/
export function playPronunciation(text: string, settings: PlaybackSettings): void;

export function pausePronunciation(): void;
export function resumePronunciation(): void;
export function stopPronunciation(): void;

/*
! Get available voices for a locale
*/
export function getVoicesForLocale(locale: Locale): VoiceInfo[];

export interface VoiceInfo {
  uri: string;
  name: string;
  locale: Locale;
  localService: boolean;
}
```

### 14.2 Storage API

```typescript
// src/lib/pronunciation/storage/

export interface PhoneticCacheEntry {
  id: number;
  textHash: string;
  locale: Locale;
  ipaTranscript: string;
  arpabetTranscript: string;
  phonemeData: string; // JSON string
  difficultyMask: string; // JSON string
  createdAt: number;
  updatedAt: number;
}

/*
! Cache lookup with O(1) hash index
*/
export function getCachedPhonemes(text: string, locale: Locale): PhoneticCacheEntry | null;

/*
! Store computed phonemes in cache
*/
export function cachePhonemes(
  text: string,
  locale: Locale,
  ipa: string,
  arpabet: string,
  phonemeData: PhonemeSegment[],
  difficultyMask: boolean[],
): void;

/*
! Voice preference CRUD
*/
export function getVoicePreferences(userId: number, locale: Locale): VoicePreference | null;

export function saveVoicePreferences(
  userId: number,
  locale: Locale,
  prefs: Partial<VoicePreference>,
): void;
```

---

## 15. Testing Strategy

### 15.1 Test Categories

| Category             | Scope                                            | Target                        |
| -------------------- | ------------------------------------------------ | ----------------------------- |
| **G2P Accuracy**     | English ARPABET output vs. CMU dictionary        | >95% accuracy on known words  |
| **IPA Conversion**   | ARPABET→IPA mapping correctness                  | 100% coverage, >99% accuracy  |
| **Cache Operations** | SQLite CRUD with concurrent access               | No corruption, proper locking |
| **Voice Fallback**   | Fallback chain with simulated unavailable voices | All fallbacks tested          |
| **UI Rendering**     | Phoneme highlight with difficulty levels         | Visual parity across browsers |
| **Performance**      | Card open → IPA display latency                  | <50ms on target devices       |

### 15.2 Testing Environment

| Test Type                 | Tool                      |
| ------------------------- | ------------------------- |
| Unit tests                | Vitest                    |
| Integration tests         | Playwright (E2E)          |
| Voice fallback simulation | Chrome DevTools emulation |

---

## 16. Risks and Mitigations

| Risk                              | Likelihood | Impact | Mitigation                           |
| --------------------------------- | ---------- | ------ | ------------------------------------ |
| Web Speech API voices unavailable | Medium     | High   | Full fallback chain + espeakjs       |
| G2P library bundle bloat          | Low        | Medium | Lazy loading + tree shaking          |
| SQLite write contention           | Low        | Low    | WAL mode + prepared statements       |
| Cross-browser TTS inconsistencies | Medium     | Medium | Vendor-prefixed detection + fallback |
| Memory pressure on mobile         | Medium     | Medium | LRU cache with configurable limit    |
| Missing voice for user's locale   | Medium     | Medium | Clear error message + text-only mode |

---

## 17. Dependencies

### 17.1 New npm Packages

| Package              | Version    | Purpose                 |
| -------------------- | ---------- | ----------------------- |
| `speech-rule-engine` | ^4.0.0     | English G2P (CMU-based) |
| `epitran`            | ^1.2.0     | French G2P (IPA output) |
| `espeakjs`           | ^0.5.0     | Fallback TTS engine     |
| `better-sqlite3`     | (existing) | SQLite operations       |

### 17.2 Browser APIs (No npm needed)

| API                 | Usage                         |
| ------------------- | ----------------------------- |
| `Web Speech API`    | Primary TTS engine            |
| `MediaRecorder API` | Future audio recording        |
| `Web Audio API`     | Future waveform visualization |
| `Web Workers`       | Background G2P processing     |

---

## 18. Maintenance Considerations

| Aspect                    | Strategy                                                   |
| ------------------------- | ---------------------------------------------------------- |
| **New language support**  | Implement new `G2PEngine` class, add to engine registry    |
| **Voice pack updates**    | Version cache with metadata table, clear on version change |
| **Bug fixes**             | Modular design allows engine swapping without UI changes   |
| **Performance tuning**    | LRU cache size configurable via `TTSSettings`              |
| **Browser compatibility** | Feature detection wrapper around Web Speech API            |

---

## 19. Success Metrics

| Metric                 | Target    | Measurement               |
| ---------------------- | --------- | ------------------------- |
| First card load (IPA)  | < 50ms    | Performance.now()         |
| Cache HIT retrieval    | < 10ms    | Performance.now()         |
| TTS start latency      | < 100ms   | Performance.now()         |
| Offline functionality  | 100%      | Service worker test       |
| G2P accuracy (English) | > 95%     | CMU dictionary validation |
| User satisfaction      | > 4.0/5.0 | In-app feedback (future)  |
