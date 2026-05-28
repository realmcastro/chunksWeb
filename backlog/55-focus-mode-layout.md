---
prioridade: 55
categoria: ux,layout
esforco: 4-6h
risco: baixo
dependencias: [53-layout-system-unification]
---

# Focus mode layout (distraction-free shell)

## Contexto

Study sessions atuais herdam TopNav + max-width container do root layout. Mobile: 64px header sticky come área útil. Sem modo "zero chrome".

## Problema

- Distração visual: nav links + theme toggle + offline indicator competem com card de estudo
- Mobile: small viewport sacrifica content para chrome
- Sem indicação que user está em "session mode" (psicológico — modo focused diferente)

## Proposta

### Trigger
- Auto-enter focus mode em rotas: `/study/*`, `/review/*`, `/feynman/session`, `/cloze`, `/dictation`
- Manual toggle: button "Enter focus mode" + key `F`
- Exit: ESC ou button "Exit focus" + confirmation se session em progresso

### Visual mudanças
- TopNav colapsa para minimal: progress bar (chunks done / target) + exit button
- Sidebar/nav escondida totalmente
- Background simplificado (sem decoração)
- Cursor auto-hide após 3s sem move (study card)
- Toasts mais discretos (apenas important)

### Session telemetry inline
- Progress bar fina topo: "12 / 30 chunks · 8m elapsed"
- Não-blocking, não roubando attention

### Wake lock
- `navigator.wakeLock.request('screen')` para evitar screen sleep durante study
- Release on exit / session end

### Per-mode customization
- Review: minimal, só card centrado
- Feynman: split (chunk top, texarea bottom)
- Dictation: audio-prominent

### Implementation
- Route group `(app)/(focus)/` em route groups (item 53)
- Layout especial sem TopNav
- Provider `<FocusModeContext>` para descendant components hide/show chrome

## Arquivos

- `src/app/(app)/(focus)/layout.tsx`
- `src/components/layout/FocusShell.tsx`
- `src/components/layout/FocusProgressBar.tsx`
- `src/lib/hooks/useWakeLock.ts`
- `src/lib/hooks/useCursorAutoHide.ts`

## Validação

- [ ] Study route auto-enter focus mode
- [ ] ESC exit prompts se session em progresso
- [ ] Wake lock liberado em exit
- [ ] Mobile fullscreen-like (no chrome wasted)
- [ ] Toast notifications minimal/important only
- [ ] Re-enter same session retoma posição

## Decisões pendentes

- Fullscreen API request? Browsers prompt user (friction).
- Theme override em focus mode (force light/dark)? Defer.
- Exit confirmation modal ou inline?
