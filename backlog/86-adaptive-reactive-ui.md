---
prioridade: 86
categoria: feature,ux,reactive
esforco: 2-3 dias
risco: medio
---

# Adaptive reactive UI (reage a sinais do usuário)

## Contexto

UI atual estática: mesmo skin todo horário, mesma intensidade independente de sessão length, mesmo conteúdo independente de contexto. App não "reage" ao user state.

## Problema

- 02h da manhã = mesmo brilho que 14h → fadiga, eye strain
- Sessão de 45min direto → sem nudge break (Pomodoro / Health)
- User chega após semana de pausa: app trata igual user diário (sem reonboarding gentil)
- Sistema escurece (OS dark mode auto sunset) mas app não responde dinamicamente
- Sem awareness de ambient light, battery, network

## Proposta

### Reações implementadas

**1. Time-of-day theming**
- Sunrise (5-9): warm yellow tints subtle
- Day (9-17): neutral
- Evening (17-20): warm orange shift, reduce blue
- Night (20-23): muted, dimmer
- Late night (23-5): heavily dimmed, optional warning "Late session — take care"
- Detect via user local time + setting "respect time-of-day"

**2. Fatigue detector**
Triggers (escolher 1+ ou combinar):
- Session continua > 30min sem break
- Avg quality drops > 15% nas últimas 10 reviews
- Response time slow > 50% vs user baseline
- Toggle ON em settings

Response (gentil):
- Toast: "You've been studying for 45min — quick 5min break?"
- Suggest break activity (stretch, hydrate)
- Pomodoro-style timer (item 65 time tracking integration)
- Não-blocking — user pode descartar

**3. Returning user detection**
- User absent > 7d em última volta:
  - Welcome back banner: "Welcome back! Here's where you left off"
  - Suggest light session (fewer chunks, easier ones)
  - Skip mastered chunks repeat (focus on lapsed)
- User absent > 30d:
  - Refresher tour (revisits onboarding flow)
  - Streak preservation grace (1-time freeze gift)

**4. Battery / Data saver mode**
- `navigator.getBattery()` low (< 20%): auto-disable animations, dim brightness suggestion via system, simpler view
- `navigator.connection.saveData` true: skip image loading, lower TTS quality
- Toast confirm: "Battery saver mode active — animations reduced"

**5. Ambient light (where supported)**
- `AmbientLightSensor` API (Chrome experimental):
  - Bright room → contrast boost
  - Dark room → dim + warm shift
- Permission-gated, graceful fallback

**6. System dark/light auto-sync**
- Already supported but extend:
  - Auto-switch theme em system change (most apps require user toggle)
  - "Follow system" default

**7. Network-aware**
- Offline detected: minimal UI, show pending sync queue (item 21)
- Slow 3G: show data-saving badge

**8. Reactive micro-copy**
Voice/tone shifts based on:
- Morning: "Good morning! Ready for today?"
- Afternoon: "Quick study session?"
- Evening: "Wind down with a review"
- After streak break: "Welcome back — no judgment, let's go" (item 79 mascot synced)

### Settings panel
`/settings/adaptive`:
- Toggle each reaction individually
- Time-of-day theming intensity (none / subtle / strong)
- Fatigue detector sensitivity
- Battery saver triggers

### Privacy
- Battery / network APIs require no special permission
- Ambient light requires explicit user permission
- Time-of-day uses local time (no IP geo)

## Arquivos

- `src/lib/adaptive/time-of-day.ts`
- `src/lib/adaptive/fatigue-detector.ts`
- `src/lib/adaptive/battery-saver.ts`
- `src/lib/adaptive/return-detector.ts`
- `src/lib/hooks/useAdaptiveTheme.ts`
- `src/components/providers/AdaptiveProvider.tsx`
- `src/components/adaptive/FatigueToast.tsx`
- `src/components/adaptive/ReturnBanner.tsx`
- `src/app/settings/adaptive/page.tsx`
- Migration: `user_settings` (adaptive_time_of_day, adaptive_fatigue, adaptive_battery_saver)

## Validação

- [ ] Theme shift at hour boundaries (verify with mocked clock)
- [ ] Fatigue toast aparece após threshold, dismiss respected
- [ ] Welcome back banner mostra após gap > 7d
- [ ] Battery low triggers reduce animations
- [ ] System theme change auto-sync no app
- [ ] Offline → banner appears, online → fades
- [ ] Settings toggle granular controls funciona
- [ ] No false positives (false fatigue toasts)
- [ ] prefers-reduced-motion respeitado

## Decisões pendentes

- Fatigue threshold: 30min (aggressive) ou 45min (lenient)?
- Time-of-day color shift magnitude: subtle só ou strong (terminal-like night mode)?
- Should adaptive UI be opt-in (default off) ou opt-out (default on)? **Opt-out** mais inviting.
- Ambient light: vale a complexidade dado Chrome-only?
- Return user grace freeze: 1× absoluto ou per ano?
- Tone shift micro-copy: hardcoded i18n strings ou LLM-generated dynamic?
