---
prioridade: 58
categoria: ux,layout,a11y
esforco: 4-8h
risco: baixo
---

# Bottom sheet pattern (mobile-first dialogs)

## Contexto

Mobile dialogs atuais centralizam modal (desktop-style). Bottom sheet (drawer up from bottom) é padrão native iOS/Android — thumb reach, dismissible drag-down.

## Problema

- Modals centralizados mobile: hard tap close, awkward thumb zones
- Settings/filter overlays atuais bloqueiam viewport inteiro
- Sem swipe-to-dismiss gesture

## Proposta

### Component
`src/components/ui/BottomSheet.tsx` (mobile-only render; desktop fallback Modal):
```tsx
<BottomSheet open onClose snap={['25%', '50%', '90%']}>
  <BottomSheet.Header>Filter chunks</BottomSheet.Header>
  <BottomSheet.Content>...</BottomSheet.Content>
  <BottomSheet.Footer>...</BottomSheet.Footer>
</BottomSheet>
```

### Features
- Drag handle visual top
- Snap points: drag para multiple heights
- Backdrop click closes
- Swipe down closes
- ESC closes (keyboard)
- Focus trap dentro
- ARIA: role=dialog, aria-modal

### Lib options
- `vaul` (Emil Kowalski, lightweight, popular)
- `@radix-ui/react-dialog` + customization
- DIY com `framer-motion` drag

### Aplicações
- Filter chunks em browse (atualmente full-screen mobile?)
- Settings quick-edit (theme, language)
- Add to collection (item 38)
- Note editor inline
- Action menu (... dropdown em chunk cards)

### Desktop fallback
- Resolution ≥ 768px: render normal Dialog centered
- Same API, conditional render

## Arquivos

- `package.json` — `vaul`
- `src/components/ui/BottomSheet.tsx`
- Refactor existing modals que beneficiam (browse filters, settings)

## Validação

- [ ] Drag down dismiss funciona
- [ ] Snap points respeitados
- [ ] Focus trap ativo
- [ ] Desktop renderiza Dialog normal
- [ ] iOS Safari: bounce/rubber band não quebra layout
- [ ] Reduced motion: animation respeita prefers-reduced-motion

## Decisões pendentes

- `vaul` adiciona ~10kb — acceptable.
- Default snap point: 50% ou 90%?
- Replace ALL mobile dialogs ou adoção gradual?
