---
prioridade: 92
categoria: a11y
esforco: 2-3 dias
risco: baixo
---

# Accessibility audit + axe-core CI gate

## Contexto

ARIA usage esparso em alguns componentes. Sem auditoria sistemática, sem teste automatizado.

## Problema

- WCAG 2.1 AA compliance unknown
- Keyboard nav não verificado (focus trap, skip link, tab order)
- Screen reader compat não testada
- Color contrast em dark mode pode falhar em estados (disabled, hover)

## Proposta

1. Adicionar `axe-core` + `@axe-core/playwright` (quando Playwright entrar)
2. Per-page audit manual com axe DevTools extension
3. Fixes iterativos:
   - Semantic HTML (button vs div)
   - ARIA labels em icon-only buttons
   - Focus management em modal/drawer
   - Skip-to-content link no layout root
   - Heading hierarchy (h1 único por page, h2 sequencial)
   - Color contrast: WCAG AA mínimo 4.5:1 normal, 3:1 large
4. CI gate quando Playwright integrado: rodar axe em rotas críticas

## Arquivos

- Todo `src/components/`
- `src/app/layout.tsx` (skip link)
- `src/app/globals.css` (focus-visible styles, contrast tokens)

## Validação

- [ ] Axe DevTools: zero violations em home, study, browse, progress
- [ ] Keyboard-only navigation completa flow de learn → review → submit
- [ ] NVDA / VoiceOver smoke test em 3 routes

## Decisões pendentes

- Storybook para component-level a11y testing?
- Auditoria com user de tecnologia assistiva real (paid testing)?
