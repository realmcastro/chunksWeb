---
prioridade: 54
categoria: refactor,ux
esforco: 1 dia
risco: baixo
dependencias: [53-layout-system-unification]
---

# Page shell templates + section primitives

## Contexto

Pages atuais (progress, study, browse, settings) implementam layout ad-hoc cada uma: heading + grid + cards. Sem `<Section>` reutilizável, sem `<MetricCard>`, sem `<DataGrid>`.

`src/app/progress/page.tsx` é o exemplo extremo: 600+ linhas com `DailyGoalBar`, `FeynmanAnalytics`, etc. inline. Sem decomposição em templates.

## Problema

- Inconsistência visual: cards header em progress não match cards em settings
- Refactor de uma page requer reimplementar layout em outra
- Empty states / loading / error per-page = duplicação
- A11y heading hierarchy quebra (h1 múltiplo, h2 sem h1)

## Proposta

### Primitives novos
- `<PageHeader title description actions />`
- `<Section title description collapsible defaultOpen children />`
- `<MetricCard label value delta icon trend />` (small, medium, large)
- `<DataGrid cols data renderRow loading empty />`
- `<ChartCard title children loading empty />`
- `<StatRow stats={[{label, value, hint}]} />`

### Composition
```tsx
<PageShell title="Progress" breadcrumbs={[...]}>
  <Section title="Today" description="Daily targets">
    <StatRow stats={[
      { label: 'Chunks studied', value: 23, hint: '+5 vs yesterday' },
      { label: 'Streak', value: '12d', hint: '🔥 personal best' },
    ]} />
  </Section>
  <Section title="Feynman analytics" collapsible>
    <ChartCard title="Quality distribution">...</ChartCard>
  </Section>
</PageShell>
```

### Heading hierarchy
- PageShell renders h1
- Section renders h2
- MetricCard label uses span (não heading)
- Auto-enforce via TypeScript prop disabling h1 dentro de Section

### Loading/Empty embedded
- `<DataGrid loading>` renderiza skeleton matching grid
- `<DataGrid empty>` renderiza `EmptyState` (item 27)

## Arquivos

- `src/components/layout/PageHeader.tsx`
- `src/components/layout/Section.tsx`
- `src/components/ui/MetricCard.tsx`
- `src/components/ui/DataGrid.tsx`
- `src/components/ui/ChartCard.tsx`
- `src/components/ui/StatRow.tsx`
- Refactor: `src/app/progress/page.tsx`, settings pages, dashboards
- Storybook stories (item 49) — high payoff aqui

## Validação

- [ ] Page header consistente em todas rotas authenticadas
- [ ] h1 único per page (a11y axe-core OK)
- [ ] Section collapse state persiste em URL (?section=feynman:open)
- [ ] Skeleton match final grid dimensions (no CLS)

## Decisões pendentes

- Persist collapse state em localStorage, URL, ou nem persistir?
- MetricCard sizes: 3 (sm/md/lg) ou 5 (xs/sm/md/lg/xl)?
- Server vs client primitives? Section collapsible precisa state → client. MetricCard pode ser server.
