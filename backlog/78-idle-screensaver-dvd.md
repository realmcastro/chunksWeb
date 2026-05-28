---
prioridade: 78
categoria: feature,ux,delight
esforco: 1 dia
risco: baixo
---

# Idle screensaver (DVD-style bouncing animation)

## Contexto

User abandona tab open em rotas não-estudo (browse, progress, settings). Screen burn-in (OLED) + sem hook visual durante ausência.

## Problema

- Tab aberto inerte sem feedback de "estou esperando você"
- Sem retorno-hook (algo que chame atenção quando user volta)
- Mobile: screen permanece on consumindo bateria sem propósito

## Proposta

### Trigger
- Detect idle: sem mousemove / keydown / touchstart / scroll por 60s (configurable)
- Apenas em rotas non-study (skip /study/*, /review/*, /practice/*, /feed)
- Não dispara se: window blurred, document.hidden, prefers-reduced-motion

### Animação base (DVD homage)
- Logo ChunksWeb (ou character mascot item 79) bouncing canvas/SVG
- Borda hit → mudar cor (cycling palette do theme)
- Random direction angle (não predictable)
- Easter egg clássico: cantos perfeitos = confetti + sound "Yes! Corner hit!" + badge unlock

### Content variants (configurable)
- **DVD bounce**: logo/icon bouncing edges
- **Chunks drift**: chunks recentemente estudados drift across screen (educational subtle)
- **Constellation**: dots conectados pulsando (calm)
- **Lo-fi rain**: ambient particles (Zen)
- **Off**: disabled

### Interactivity
- Any input → instant fade-out, return ao conteúdo
- Tap anywhere durante screensaver → exits
- Click logo durante bounce → wiggle + sound

### Lore / engagement
- After N total corner-hits across sessions: unlock "DVD Master" achievement (item 67)
- Mascot variant (item 79): mascot animation (sleeping, dreaming chunks)

### Implementation
- Component `<IdleScreensaver />` mounted no layout root
- `useIdleTimer` hook (lib `react-idle-timer` ou custom)
- Canvas 2D animation OR SVG transforms
- requestAnimationFrame loop
- Pause loop quando hidden (visibility API)

### Settings
- Toggle on/off
- Idle delay slider: 30s / 1min / 5min / 10min
- Variant picker

### Performance
- Canvas 60fps target, fallback 30fps low-end
- Battery API: throttle/disable em low battery
- Reduce motion preference → fade-only, no bounce

## Arquivos

- `src/components/screensaver/IdleScreensaver.tsx`
- `src/components/screensaver/DvdBounce.tsx`
- `src/components/screensaver/ChunksDrift.tsx`
- `src/components/screensaver/Constellation.tsx`
- `src/lib/hooks/useIdleTimer.ts`
- `src/app/settings/appearance/page.tsx` — adicionar settings
- Migration: `user_settings.screensaver_enabled`, `user_settings.screensaver_delay_s`, `user_settings.screensaver_variant`

## Validação

- [ ] Idle 60s em /browse → screensaver aparece
- [ ] Idle em /study → NÃO aparece (skip rule)
- [ ] Tap exits, retoma scroll position
- [ ] CPU usage idle screensaver < 5%
- [ ] Bateria mobile não drena (visibility pause)
- [ ] prefers-reduced-motion respeitado
- [ ] Corner hit detection accurate (corner perfeito triggera)
- [ ] Dark/light mode color palette
- [ ] Variant switch persiste user setting

## Decisões pendentes

- Default variant: DVD bounce (nostálgico) ou Chunks drift (educational)?
- Audio em corner-hit: default ON ou OFF (autoplay policies)?
- "DVD Master" badge threshold: 1 hit (rare event), 5 hits, 10 hits?
- Mascot dependency: aguarda item 79 ou ship sem mascot primeiro?
- Screensaver durante background music (lo-fi feature future)?
