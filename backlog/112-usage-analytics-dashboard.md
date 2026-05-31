---
prioridade: 112
categoria: feature,tracking,ux
esforco: 1.5 dias
risco: baixo
dependencias: [111-idle-detection-net-time, 61-progress-dashboard-overhaul]
---

# Usage analytics dashboard — visualização de tempo por seção

## Contexto

Com tracking e idle detection funcionando (110, 111), esta task é a camada de visualização: o user vê onde passa seu tempo, líquido vs bruto, evolução ao longo do tempo.

## Problema

- Dados de sessão existem mas são invisíveis ao user
- Sem comparação "tempo no estudo de línguas vs outros módulos"
- Sem feedback de se o user está presente ou só com aba aberta

## Proposta

### Onde exibir
- Nova aba "Tempo" dentro de `/progress` (ou sub-seção do dashboard overhaul 61)
- Widget compacto na homepage: "Hoje: 1h 23min líquidos no sistema"

### Visualizações

#### 1. Resumo diário (hoje)
- Total bruto vs total líquido
- Breakdown por seção (donut chart)
- "Você passou 73% do tempo ativo hoje" (líquido/bruto)

#### 2. Timeline da semana
- Stacked bar: horas por seção, 7 dias
- Linha de tendência: liquid time

#### 3. Heatmap mensal
- GitHub-style, cor = liquid minutes por dia
- Hover: tooltip com breakdown por seção

#### 4. Seção mais usada
- "Esta semana você passou mais tempo em: Revisão de chunks (2h 14min)"

#### 5. Sessões longas vs fragmentadas
- "Média de sessão: 18min" — indica foco vs multitarefas

### API
- `GET /api/tracking/stats?from=DATE&to=DATE&groupBy=day|section` → dados agregados
- `GET /api/tracking/stats/today` → resumo rápido para widget homepage

## Arquivos

- `src/app/progress/time/page.tsx` — ou tab dentro de 61
- `src/components/tracking/DailySummaryCard.tsx`
- `src/components/tracking/WeeklyStackedBar.tsx`
- `src/components/tracking/UsageHeatmap.tsx`
- `src/app/api/tracking/stats/route.ts` — aggregations
- `src/lib/db/sqlite.ts` — getUsageStats, getDailyBreakdown

## Validação

- [ ] Donut exibe proporções corretas de bruto vs líquido
- [ ] Heatmap: dia sem sessão = cinza, dia com muito uso = cor saturada
- [ ] Tooltip do heatmap mostra breakdown por seção
- [ ] Widget homepage atualiza ao final de cada sessão
- [ ] Dados de 90 dias carregam em < 500ms (query com índice)

## Decisões pendentes

- Privacidade: o user pode exportar ou deletar seus dados de tracking?
- Widget na home: opt-in ou sempre visível?
- Benchmark: mostrar comparação com "semana passada"?
