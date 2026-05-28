---
prioridade: 57
categoria: ux,layout,feature
esforco: 1-2 dias
risco: baixo
---

# Command palette (Cmd+K / Ctrl+K global)

## Contexto

App tem múltiplas rotas + actions. Navegação atual: clicks no TopNav. Power users e a11y users (keyboard-only) sem fast-access.

## Problema

- Atalho universal "what can I do?" ausente
- Search inline em pages (browse/search) duplica esforço — sem global search
- Settings escondidas requerem clicks para alcançar

## Proposta

### Trigger
- `Cmd+K` (Mac) / `Ctrl+K` (Win/Linux)
- Botão visual na TopNav: "Search... ⌘K"

### Overlay layout
- Modal centered (max-width 600px), backdrop blur
- Input topo, results lista, footer hint keys
- ESC closes, Enter executes, ↑↓ navega

### Categories de resultados
1. **Quick actions**:
   - "Start review session"
   - "Resume last session"
   - "Create note on current chunk"
   - "Toggle dark mode"
   - "Sign out"

2. **Navigate**:
   - All routes (/study, /browse, /progress, etc.)
   - Recent pages visited (last 10)

3. **Search chunks**:
   - Search chunk_text/meaning (FTS5 if item 17 ship)
   - Click → open chunk detail

4. **Categories** + **Grammar structures**: jump to specific

5. **Settings**: each settings page entry

### Fuzzy match
- Lib `cmdk` (mantida, popular, react) ou DIY com `fuse.js`
- Match em title + keywords + aliases

### Custom actions
- Plugins-style: hook que registers actions
  ```tsx
  useCommandPalette({
    id: 'start-review',
    title: 'Start review session',
    keywords: ['review', 'study', 'practice'],
    action: () => router.push('/study/review'),
  });
  ```

### Recents + favorites
- Frequently used actions promoted (last 7d)
- Pin action ⭐ → always top

### Mobile
- Trigger via swipe down ou floating button (?)
- Layout: full-screen modal mobile

## Arquivos

- `package.json` — `cmdk`
- `src/components/CommandPalette.tsx`
- `src/components/providers/CommandPaletteProvider.tsx`
- `src/lib/hooks/useCommandPalette.ts`
- Register actions across pages

## Validação

- [ ] Cmd+K abre em qualquer page
- [ ] ESC fecha
- [ ] Fuzzy match "rev" → "Start review session"
- [ ] Recent pages section preenche
- [ ] Mobile: usable touch
- [ ] Screen reader: aria-live, focused result announced
- [ ] Performance: < 50ms response em 1000 actions

## Decisões pendentes

- Lib `cmdk` (Vercel) vs DIY?
- Chunks search inline vs link "Search all chunks"?
- AI command integration (item 80): "Translate 'how are you'" → response inline?
