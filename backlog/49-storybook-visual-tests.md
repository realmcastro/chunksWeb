---
prioridade: 49
categoria: dx,testing
esforco: 2-3 dias
risco: baixo
---

# Storybook + visual regression

## Contexto

UI primitives (Button, Card, Skeleton, etc.) testados apenas integrados em pages. Sem doc isolada, sem visual regression.

## Problema

- Mudança em Button afeta N pages — regression risk alto sem isolated test
- Designer-dev handoff: sem reference visual
- Dark mode coverage incompleta (visual)

## Proposta

### Storybook 8
```bash
npx storybook@latest init
```
- Next.js framework adapter
- Tailwind preset
- a11y addon
- viewport addon (mobile sizes)

### Stories iniciais (top 10 UI primitives)
- Button (variants: primary, ghost, destructive, disabled, loading)
- Card
- Input
- Skeleton
- Toast (sonner)
- ChunkCard
- StreakBadge (item 60)
- EmptyState (item 27)
- LanguageSelector
- ShortcutHelp (item 26)

### Visual regression
- Chromatic (free for OSS) ou Playwright + visual diff
- CI: capture snapshots, diff against baseline
- Fail PR se mudança visual não-intencional

### Docs autogen
- MDX docs em cada story
- Props table auto-generated

## Arquivos

- `.storybook/` (config)
- `src/components/**/*.stories.tsx`
- `.github/workflows/chromatic.yml`
- `package.json` — devDeps

## Validação

- [ ] Storybook starts em `npm run storybook`
- [ ] 10 top components têm stories
- [ ] Dark mode toggle funciona em Storybook
- [ ] Visual diff CI roda em PR
- [ ] a11y addon flags issues

## Decisões pendentes

- Chromatic vs self-hosted (Storybook Test Runner + Playwright)?
- Visual baseline: branch main? Atualizar requer aprovação manual.
- Stories como source of truth para design system?
