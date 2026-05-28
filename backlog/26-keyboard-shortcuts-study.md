---
prioridade: 26
categoria: ux,a11y
esforco: 4h
risco: baixo
---

# Keyboard shortcuts em study mode

## Contexto

Study mode renderiza botões Q0–Q5 para rating. Sem shortcuts → user precisa mouse/touch repeatedly. Power users frustrados.

## Problema

- Throughput baixo: cada review = mouse move + click
- Não amigável para teclado-only (a11y)
- Padrão de mercado (Anki, RemNote) usa space/1-4

## Proposta

### Hook
`src/lib/hooks/useKeyboardShortcuts.ts`:
```ts
export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // skip when typing
      const fn = handlers[e.key];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlers]);
}
```

### Bindings (study)
- `Space` ou `Enter`: flip card (show answer)
- `1` `2` `3` `4` `5`: quality rating + next
- `Esc`: end session
- `?`: show shortcut help dialog

### Bindings (browse)
- `J` / `K`: next/prev chunk
- `/`: focus search input
- `F`: toggle favorite

### Help overlay
- Component `ShortcutHelp.tsx` — modal listando bindings
- Trigger: `?` key
- Acessível: focus trap, ESC closes

## Arquivos

- `src/lib/hooks/useKeyboardShortcuts.ts` (NEW)
- `src/components/study/ReviewSession.tsx` — wire bindings
- `src/components/browse/BrowseClient.tsx` — wire bindings
- `src/components/ui/ShortcutHelp.tsx` (NEW)
- Translations: keys/descriptions

## Validação

- [ ] Space flip funciona
- [ ] 1-5 rating + advance
- [ ] Inputs (search) não disparam shortcuts
- [ ] Help dialog acessível (focus trap, ESC)
- [ ] Mobile: shortcuts não interferem com touch
- [ ] Conflicts com browser shortcuts (Ctrl+F, etc) — só usar keys não-modifier

## Decisões pendentes

- Customizable bindings (user-defined)? Defer initially.
- Visualização hint inline ("Press 1") vs modal-only?
