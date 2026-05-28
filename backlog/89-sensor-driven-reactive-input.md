---
prioridade: 89
categoria: feature,reactive,ux
esforco: 2-3 dias
risco: medio
---

# Sensor-driven reactive input (gyro, gesture, typing rhythm, gamepad)

## Contexto

App input atualmente: click, tap, keyboard. Modern devices expõem N sensores (gyro, accelerometer, gamepad, ambient sound, pointer pressure) e padrões temporais (typing rhythm, idle gaps) que app ignora.

## Problema

- Mobile não aproveita gyro (parallax 3D natural disponível em hardware)
- Typing rhythm sinaliza confidence — app não reage (hint when struggling, celebrate when fluent)
- Sem gesture support (shake-to-shuffle, double-tap-back)
- Gamepad pluged → ignored (acessibilidade + gamer audience)
- Frantic clicks (anxiety, rage-click) sem detection → user frustration silent

## Proposta

### 1. Gyroscope parallax (mobile)
- `DeviceOrientationEvent` (com permission iOS 13+)
- Background depth layers shift baseado em tilt (subtle, < 10px)
- Cards levant slightly em tilt direction
- Settings toggle (some users get motion sick)

### 2. Shake gesture
- `devicemotion` + threshold detection
- Shake média: shuffle next chunk in feed (item 76)
- Shake forte: "Did you mean to skip? [Yes / No]" undo prompt
- Cooldown 2s para evitar trigger acidental

### 3. Double-tap-back-of-phone (iOS)
- Não-API direta web — iOS Shortcuts integration documentation hint
- Alternative: triple-finger tap PWA installable

### 4. Typing rhythm detection (cloze, dictation, feynman)
Track:
- Keys per second
- Pause distribution
- Backspace frequency
- Typo correction rate

Reactions:
- Slow + many pauses (struggling) → after 30s sem progresso: "Stuck? Show hint?" button appears
- Many backspaces (uncertain) → subtle bg shift suggestion
- Fast + clean (confident) → invisible (do not interrupt flow)
- After session: "Your typing flow improved 12% this week" insight

### 5. Frantic-click detection
- 5+ clicks em < 2s no mesmo elemento (ou random) → likely frustration
- Reactions:
  - Microcopy toast: "Hmm, something not working? [Report issue]"
  - Log event for analytics (UX research)
  - Disable element brevemente (anti-double-submit)

### 6. Gamepad support
- `navigator.getGamepads()` polling
- Map study controls to gamepad:
  - A button: flip card / show answer
  - D-pad / triggers: rate 1-5
  - Start: pause / settings
- Useful for: accessibility, study while exercising (bike trainer + gamepad), gamer audience
- Auto-show "Gamepad connected — try controller mode!" toast when first detected

### 7. Pointer pressure (Pointer Events)
- Hard click vs light click distinction (touchscreens / Apple Pencil)
- Hard click + flashcard → reveal hint instead of full answer (granular)
- Skip in pressure < 0.5: default behavior

### 8. Ambient sound level (Web Audio API)
- Request mic permission opt-in (separate from item 70 recording)
- Loud environment detected → auto-increase TTS volume +20%
- Quiet environment → keep low (don't startle in library)
- Privacy: levels-only, no transcription

### 9. Tab visibility reactive
- `document.visibilitychange`:
  - Hidden > 5min: auto-pause session
  - Return: "Welcome back, resume from chunk 12?" prompt
- Already partial in Wake Lock; extend.

### 10. Idle gap reactions (within session)
- > 10s sem input em study card → subtle hint nudge ("Take your time / Need help?")
- > 30s → offer skip / show answer
- Pause SM-2 quality decay during idle (item 65 time tracker integration)

### Settings panel
`/settings/sensors`:
- Each toggle granular
- "Auto-detect available sensors" + opt-in per type
- Permissions clear: explain each
- "Test gyro" button (visual feedback)

### Privacy
- Mic for ambient: opt-in, separate permission from recording
- Camera: NOT used
- Gyro/accelerometer: standard web permission iOS 13+
- All processing local — never sent to server

## Arquivos

- `src/lib/sensors/gyro.ts`
- `src/lib/sensors/shake.ts`
- `src/lib/sensors/typing-rhythm.ts`
- `src/lib/sensors/gamepad.ts`
- `src/lib/sensors/ambient-sound.ts`
- `src/lib/hooks/useGyroParallax.ts`
- `src/lib/hooks/useShakeGesture.ts`
- `src/lib/hooks/useTypingRhythm.ts`
- `src/lib/hooks/useFranticClicks.ts`
- `src/lib/hooks/useGamepad.ts`
- `src/components/sensor/HintNudge.tsx`
- `src/components/sensor/GamepadIndicator.tsx`
- `src/app/settings/sensors/page.tsx`
- Migration: `user_settings` (sensor_* toggles)

## Validação

- [ ] Gyro parallax smooth (60fps) iOS Safari + Android Chrome
- [ ] Shake detection accurate (não fires em walking with phone)
- [ ] Typing rhythm não false-positive (slow typist != struggling)
- [ ] Frantic click triggers apenas em real rage-click
- [ ] Gamepad: A/B/D-pad map funciona
- [ ] Pressure: high vs low click distinguíveis
- [ ] Ambient sound: volume adjust accurate
- [ ] Permissions UX gracious (decline → graceful fallback)
- [ ] Battery: sensores não drenam (sampling rate moderada)

## Decisões pendentes

- **Gyro permission iOS prompt**: ask em first study mode load ou em settings?
- Shake threshold calibração: per-device variability — auto-calibrate?
- Typing rhythm: privacy concerns? Mention em privacy policy.
- Gamepad: support which controllers? Xbox + PS standard, others fallback.
- Ambient sound: skip given mic permission already polarizing? Consider drop.
- Pointer pressure: Apple Pencil specific ou generic Pointer Events?
- Reaching "feature creep" — implement MVP subset (3-4 sensors) primeiro?
