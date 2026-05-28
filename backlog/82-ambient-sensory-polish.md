---
prioridade: 82
categoria: feature,ux,delight,a11y
esforco: 2-3 dias
risco: baixo
---

# Ambient theme + sensory polish (sounds, haptics, micro-interactions)

## Contexto

App visualmente OK mas sensorialmente flat: zero sound effects, zero haptic feedback, transições mínimas. Modern apps usam camadas sensoriais para confirmar ações + criar tactile feel.

## Problema

- Click button → silent → user uncertain action registered (especially mobile)
- Right answer = same feedback as wrong (visual only)
- Sem rituals sonoros que reforçam memória (Duolingo correct chime icônico)
- App "feel" mais site que aplicativo
- Sem variação visual sazonal — sempre mesmo skin

## Proposta

### 1. Sound effects layer
Curated set, intencional, opt-in/out:

**Action sounds**:
- Click button (subtle tap)
- Submit answer correct (rising chime)
- Submit answer wrong (gentle low note, no harsh buzz)
- Quality 5 (perfect) (special celebratory)
- Session complete (fanfare 2s)
- Streak extended (rising arpeggio)
- Achievement unlock (sparkle + voice "ding")
- Pet pet (item 79) (boop)

**Ambient (toggle)**:
- Lo-fi study music loops (3-4 tracks royalty-free)
- Nature sounds (rain, café, library)
- Volume slider separate from SFX

Lib: HTML5 Audio + sprite sheet (single file, offset playback) OR Howler.js (~7kb).

### 2. Haptic feedback (mobile)
`navigator.vibrate()`:
- Correct answer: short 10ms
- Wrong: double 20ms
- Streak milestone: pattern [50, 30, 50]
- Drag interactions: light tactile
Settings toggle. iOS Web vibration limited — degrade gracefully.

### 3. Micro-interactions catalog
Consistent motion vocabulary:

- **Button press**: scale 0.97 down + spring up
- **Card flip**: 3D rotate Y, 400ms ease
- **Correct flash**: green glow brief
- **Wrong shake**: 4px horizontal × 3 cycles
- **Streak counter increment**: number scrolls + brief scale-up
- **Confetti**: on achievement / PR — lib `canvas-confetti` (~6kb)
- **Page transitions**: subtle fade + slide between routes
- **Skeleton shimmer**: gradient pulse
- **Toast slide-in**: from bottom (mobile), top-right (desktop)
- **Loading dots**: stagger animation

Padronize com Tailwind keyframes + motion vars.

### 4. Seasonal themes / event variants
Light visual theming per period:

- Halloween (Oct 25-31): orange accent, pumpkin icons hint
- Winter (Dec 15-Jan 5): snow falling overlay, blue tint
- Lunar New Year: red accent, lantern bg
- Pride (Jun): rainbow streak fire
- User birthday (settings opt-in): confetti + birthday banner
- App anniversary: special badge availability

Themes auto-apply unless user opted out. Subtle — não overwhelm.

### 5. Reduced motion respect
`prefers-reduced-motion`:
- Disable all transitions
- Static skeleton (no shimmer)
- Sounds + haptics still allowed (motion ≠ audio)

### 6. Audio + motion settings panel
`/settings/sensory`:
- Master sound toggle + volume
- SFX vs ambient separate sliders
- Haptic feedback toggle
- Motion intensity: none / subtle / full
- Seasonal themes toggle
- Preview each sound (button play)

## Arquivos

- `package.json` — `canvas-confetti`, optional `howler`
- `public/audio/sfx/` — curated sound files (royalty-free)
- `public/audio/ambient/` — lo-fi tracks
- `src/lib/audio/sfx-player.ts`
- `src/lib/audio/ambient-player.ts`
- `src/lib/haptics.ts`
- `src/lib/motion/transitions.ts` — Framer Motion variants ou CSS keyframes
- `src/components/effects/Confetti.tsx`
- `src/lib/themes/seasonal.ts`
- `src/app/settings/sensory/page.tsx`
- Migration: `user_settings` add (sound_enabled, sound_volume, ambient_volume, haptic_enabled, motion_pref, seasonal_themes)

## Validação

- [ ] Click qualquer button → sound (se enabled)
- [ ] Mobile vibra on correct/wrong
- [ ] Achievement → confetti + sound + haptic combined
- [ ] Settings preview cada sound
- [ ] prefers-reduced-motion: all transitions disabled, sound preserved
- [ ] Volume sliders alteram realtime
- [ ] Performance: sound playback no jank
- [ ] Seasonal theme apply em data correct (verifica TZ user)
- [ ] Bundle: assets de audio cached pelo SW (offline support)

## Decisões pendentes

- **Sound design**: hire sound designer ou royalty-free packs (freesound.org, mixkit)?
- Default ON ou OFF? **Default ON em desktop, OFF em mobile (autoplay)**.
- Ambient music: premium feature ou free?
- Seasonal themes opt-out vs opt-in default? Some users hate surprises.
- Animation lib: Framer Motion (~30kb gz) vs CSS keyframes (zero)? CSS para 80% casos, Framer para complex.
- Confetti density: subtle vs full party mode? Setting "intensity" slider.
- Multiple celebration tiers: streak 7 small confetti, streak 30 big confetti, streak 100 fireworks?
