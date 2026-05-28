---
prioridade: 77
categoria: feature,interactive
esforco: 2-3 dias
risco: medio
dependencias: [70-audio-recording-module]
---

# Pronunciation duel arena (vs native reference)

## Contexto

Pronunciation engine exists (item 70 recording proposed). User practica mas sem competition / clear win-condition.

## Problema

- Speaking practice solitary; sem hook gamification
- Sem clear "I nailed it" moment
- Phoneme-level feedback ausente

## Proposta

### Página `/practice/duel`

#### Flow
1. Pick chunk (or get random recommended)
2. Listen native TTS (item 42 voice)
3. Record user speaking (Web Audio item 70)
4. Side-by-side waveform compare:
   - Native (left, blue)
   - User (right, green)
5. Score 0-100:
   - Phoneme accuracy (IPA G2P compare)
   - Prosody (pitch curve, duration ratio)
   - Stress placement
6. Per-phoneme breakdown: green ✓ / yellow ~ / red ✗
7. Replay slow / loop tough spots

#### Reward loop
- Score > 90: "Perfect! 🎯" + badge progress
- Score 75-90: "Great! Try once more for gold"
- Score < 75: encouraging tips ("Stress falls on syllable 2")
- Streak counter: consecutive 80+ scores
- Daily duel: 5 chunks/day for special badge

#### Visualization
- Waveform: lib `wavesurfer.js` ou DIY canvas
- Pitch curve overlay (autocorrelation pitch detection client-side)
- IPA align: char-by-char colored

#### Practice phoneme drills
- Detect repeated weak phonemes (e.g. /ð/ "th") → suggest drill
- "Sound focus: /θ/" — chunk list emphasizing target sound

#### Leaderboard hook
- Optional submit best score to leaderboard (item 85) — opt-in
- Privacy: audio NEVER uploaded por padrão; only score

### Storage
```sql
CREATE TABLE pronunciation_attempts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  chunk_id INTEGER,
  score INTEGER,
  phoneme_scores TEXT,    -- JSON: per-phoneme {ipa, score, ok}
  pitch_diff REAL,
  duration_ratio REAL,
  attempted_at INTEGER
);
```

Audio blob: client-side only (no upload). Optional later: upload best for showcase.

## Arquivos

- `src/app/practice/duel/page.tsx`
- `src/components/practice/WaveformCompare.tsx`
- `src/components/practice/PhonemeBreakdown.tsx`
- `src/lib/audio/pitch-detect.ts`
- `src/lib/audio/phoneme-align.ts`
- `src/lib/audio/scoring.ts`
- `src/app/api/duel/save-score/route.ts`
- Migration: `pronunciation_attempts`

## Validação

- [ ] Mic permission flow gracious
- [ ] Score reproducible (same audio → same score ±2)
- [ ] Per-phoneme accuracy correlates com perception
- [ ] Mobile mic: noise floor OK
- [ ] Privacy: audio not uploaded (verify network tab)
- [ ] Score history accessible per chunk

## Decisões pendentes

- Phoneme alignment lib: forced aligner (Montreal Forced Aligner — heavy)? DIY simpler?
- LLM-assisted scoring (Whisper API transcribe + compare)? Cost $.
- Audio upload opt-in (showcase melhor pronunciation)? Privacy implications.
- Daily duel: separate item ou subsumed em achievements?
