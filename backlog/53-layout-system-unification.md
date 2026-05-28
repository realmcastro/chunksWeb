---
prioridade: 53
categoria: refactor,ux,a11y
esforco: 1-2 dias
risco: medio
---

# Unificação do sistema de layout (TopNav vs Sidebar órfão + shell responsivo)

## Contexto

`src/app/layout.tsx` monta `<TopNav />` como shell único (horizontal, fixed top). `src/components/layout/Sidebar.tsx` existe (179 linhas, completo: collapsible, mobile drawer, language section) mas **não é montado em lugar algum** — código órfão.

Header em `TopNav.tsx` linha 30: "TopNav: Horizontal navigation bar that replaces the sidebar". Confirma migração mas Sidebar não foi deletado.

## Problema

- **Código morto**: Sidebar.tsx + ChevronLeft icon + collapsed state lógica não usados — bundle gasto, manutenção falsa
- **Inconsistência shell**: pages declaram próprio padding/max-width (ex: progress page envolto em `mx-auto max-w-7xl` do layout root, mas study/learning pages usam outro width)
- **Mobile UX**: TopNav drawer slide-out OK, mas dense study pages (review, vocabulary game) competem com 64px header sticky → área útil reduzida no mobile
- **Layout shifts**: header `sticky top-0` + lazy load de Auth state causa CLS quando username/streak aparecem
- **Sem persona-aware shell**: logged-out (login/register/landing) recebe mesmo TopNav que logged-in — TopNav esconde nav links sem auth mas mantém estrutura ociosa

## Proposta

### 1. Remover Sidebar.tsx morto OU promover ambos
**Decisão pendente**: Sidebar é melhor pattern para desktop (mais espaço vertical, sticky nav scrolling) — manter TopNav mobile + Sidebar desktop? Ou deletar Sidebar.tsx + assumir TopNav único?

Recomendação: **adaptive layout**
- `<768px`: TopNav atual (drawer)
- `≥768px && <1280px`: TopNav atual horizontal
- `≥1280px`: Sidebar fixa esquerda + header simplificado top (usuário + offline indicator + theme)

### 2. Route groups por persona
Next 14 App Router suporta route groups `(folder)` sem afetar URL:

```
src/app/
├── (marketing)/        # logged-out: landing, /privacy, /terms
│   ├── layout.tsx      # marketing shell (footer rico, CTAs)
│   └── page.tsx
├── (auth)/             # login, register, forgot, reset
│   └── layout.tsx      # centered card, sem nav
├── (app)/              # logged-in: home, study, browse, progress, settings
│   ├── layout.tsx      # TopNav + Sidebar adaptive
│   ├── page.tsx
│   ├── study/
│   ├── browse/
│   ├── progress/
│   └── settings/
└── (admin)/            # dependência item 75
    └── layout.tsx
```

### 3. Page shell primitives
Adicionar `src/components/layout/PageShell.tsx`:
```tsx
interface PageShellProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  density?: 'comfortable' | 'compact' | 'dense';
}
```
- `density` controla padding/spacing global (study mode = dense para mais conteúdo)
- Breadcrumbs auto-gerados via pathname ou explicit
- Slot `actions` para botões no header da page

### 4. Layout shift fix
- Auth state hydration: render placeholder com same dimensions de username badge
- LearningLanguage flag: reserve fixed-width div mesmo enquanto loading
- Streak badge (item 60): reserve placeholder antes da query

### 5. Density modes (study sessions)
- Study route opta-in `density="dense"` → reduz padding lateral, header colapsa em scroll-down
- Setting "Compact mode" global (data-density attr no html)

## Arquivos

- Deletar OU promover: `src/components/layout/Sidebar.tsx`
- Reorganizar: `src/app/` em route groups
- Novo: `src/components/layout/PageShell.tsx`
- Novo: `src/components/layout/AppShell.tsx` (TopNav + Sidebar adaptive)
- Novo: `src/components/layout/AuthShell.tsx` (centered card)
- Novo: `src/components/layout/MarketingShell.tsx`
- Update: `src/app/layout.tsx` — root layout minimalista (providers only)

## Validação

- [ ] Bundle reduz após delete Sidebar morto (ou Sidebar usada se promovida)
- [ ] CLS < 0.1 em primeira visita (Lighthouse)
- [ ] Mobile drawer ainda funciona
- [ ] Density toggle persiste (user setting)
- [ ] Breadcrumbs corretos em rotas aninhadas
- [ ] Logged-out pages (login/register) sem TopNav vazio
- [ ] Skip-to-main-content link (a11y, ref item 92)

## Decisões pendentes

- **TopNav único vs adaptive (TopNav mobile + Sidebar desktop)?** Recomendado adaptive.
- **Deletar Sidebar.tsx ou ressuscitar?** Se deletar, commit separado para historiar intencionalidade.
- **Density modes**: 2 (comfortable/compact) ou 3 (+ dense)?
- **Breadcrumbs**: auto-derived from pathname ou opt-in per page?
- **Sticky header em mobile**: hide-on-scroll-down ou always-visible?
