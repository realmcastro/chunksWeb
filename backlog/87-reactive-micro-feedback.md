---
prioridade: 87
categoria: feature,ux,reactive,delight
esforco: 1-2 dias
risco: baixo
---

# Reactive micro-feedback (cursor, hover, scroll, motion physics)

## Contexto

App reage apenas a clicks discretos. Movimentos contínuos do user (mouse position, scroll velocity, touch pressure, swipe inertia) ignorados. Apps modernos (Linear, Vercel) usam physics-based feedback que faz UI parecer viva.

## Problema

- Hover states binary (on/off) sem antecipação
- Scroll inerte — sem reveal animations, sem parallax
- Cursor não tem feedback ambient (modern sites com cursor effects feel premium)
- Cards estáticos — sem tilt em mouse over
- Touch sem inertia natural (resists "physics" feel)
- Sem indicação de proximity / intent (e.g., button "vibra" quando cursor approaches)

## Proposta

### Effects implementados (todos opt-in via setting "Motion intensity")

**1. Cursor magnetics**
- Botões CTA primary "puxam" cursor sutilmente quando proximity < 80px
- Implementation: mousemove listener + transform translate ao botão (lerp toward cursor)
- Disable em mobile (no cursor)

**2. Card tilt (mouse over)**
- ChunkCard hover: subtle 3D tilt (max ±5deg) following cursor position
- Spring damped — não jittery
- Inset reflection highlight follows cursor (luz reflectiva)

**3. Scroll-triggered reveals**
- IntersectionObserver: elements fade-in + slide-up ao entrar viewport (10-20px translateY)
- Direction inteligente: scroll down = elements from bottom; scroll up = from top
- Stagger em listas (delay incremental 30ms por item)

**4. Parallax depth**
- Background layer scrolls mais slow que foreground
- Em hero sections (dashboard, landing)
- Subtle (não overpowering)

**5. Hover anticipation**
- Cursor approaching link/button (within 100px): button antecipa scale 1.02
- Communicates "I see you coming"
- Reduces perceived click latency

**6. Swipe inertia / momentum**
- Mobile: lists/carousels com momentum scroll
- Touch swipe rapid → coasts (decelerate)
- Lib: built-in CSS `scroll-snap` + `overflow-scroll touch-action: pan-x` ou Framer Motion drag
- Snap to chunks no chunks feed (item 76)

**7. Ripple effect on click**
- Material-style ripple radiating from click point
- Subtle, button-bound
- Speed = click pressure (PointerEvent.pressure)

**8. Magnetic snap em drag**
- Em split pane resize (item 56): snap em standard widths (33/50/67%)
- Drag handle "stickies" near snap points

**9. Focus motion**
- Tab to next input: smooth ring transition + brief glow
- Input gains focus: subtle scale 1.01 + border color animate

**10. Scroll velocity-aware**
- Scrolling fast: hide non-essential UI (toolbars collapse)
- Scrolling slow / stopped: full UI returns
- Useful em chunks feed (item 76) + long lists

### Performance budget
- All transforms via GPU (transform / opacity only — no layout)
- requestAnimationFrame throttle
- Reduce motion preference → all disabled
- Mobile low-end: reduced intensity automatically

### Settings
`/settings/motion`:
- Motion intensity: None / Subtle / Standard / Playful
- Per-effect toggles
- Reduced motion respect overlay

### Implementation tools
- Framer Motion (~30kb gz) — best for spring/damping
- OR CSS @keyframes + transforms para 80% casos
- IntersectionObserver native
- Pointer Events para pressure

## Arquivos

- `src/lib/motion/cursor-magnetics.ts`
- `src/lib/motion/card-tilt.ts`
- `src/lib/motion/scroll-reveals.ts`
- `src/lib/motion/ripple.ts`
- `src/lib/hooks/useScrollVelocity.ts`
- `src/lib/hooks/useMagneticCursor.ts`
- `src/components/motion/Reveal.tsx`
- `src/components/motion/MagneticButton.tsx`
- `src/components/motion/TiltCard.tsx`
- `src/app/settings/motion/page.tsx`
- Migration: `user_settings.motion_intensity`

## Validação

- [ ] Cursor magnetics funciona desktop, no-op mobile
- [ ] Tilt cards smooth (60fps, no jitter)
- [ ] Scroll reveals stagger correto
- [ ] Reduce motion: tudo disabled
- [ ] Performance: jank-free em 4× CPU throttle
- [ ] Mobile inertia: feels natural (não over-coasty)
- [ ] Focus ring transition acessibilidade (visible always)
- [ ] Battery low (item 86) reduz effects automaticamente

## Decisões pendentes

- **Motion intensity default**: Subtle (safe) ou Standard (more wow)?
- Lib choice: Framer Motion (consistent API) ou hand-CSS (smaller bundle)?
- Cursor magnetics range: 80px (subtle) ou 120px (more noticeable)?
- Card tilt angle: ±3deg (subtle) ou ±8deg (dramatic)?
- Disable effects em low-end devices via `navigator.hardwareConcurrency` heuristic?
