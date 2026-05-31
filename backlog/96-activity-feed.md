---
prioridade: 96
categoria: feature,ux,tracking
esforco: 1.5 dias
risco: baixo
dependencias: [84-internal-event-bus, 83-domain-model-pluggable-topics]
---

# Activity feed — timeline unificada da vida

## Contexto

Com event bus (84), cada ação no sistema produz um evento persistido. Esta task transforma `domain_events` em um feed temporal legível: o GitHub activity graph da existência humana.

## Problema

- User não tem visão do que fez no sistema ao longo do tempo
- Cada módulo tem seus próprios logs isolados
- Sem narrativa: "segunda-feira estudei Rust, li 30 páginas, fiz 3 metas"

## Proposta

### Feed em `/activity` ou widget no dashboard

```
━━ Hoje — 31 de maio ━━━━━━━━━━━━━━━━━━━━━
  14:32  Revisou 23 chunks de Python           [study]
  13:15  Leu 18 páginas de "Designing Data..." [reading]
  11:00  Escreveu no diário                    [journal]
  10:45  Completou 3 metas do dia              [journal]

━━ Ontem ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  22:10  45 min de inglês · 31 chunks          [study]
  20:30  Começou "Clean Code"                  [reading]
```

### Eventos exibidos

| Evento | Texto gerado |
|--------|-------------|
| `study.session.completed` | "Revisou N chunks de [domínio] · Xmin" |
| `study.chunk.reviewed` (milestone) | "100º chunk revisado em Python!" |
| `reading.session.ended` | "Leu N páginas de [título]" |
| `reading.book.completed` | "Concluiu '[título]' 🎉" |
| `journal.entry.saved` | "Escreveu no diário · N palavras" |
| `journal.goal.completed` | "Completou meta: [texto]" |
| `app.streak.milestone` | "Streak de 30 dias! 🔥" |

### Agrupamento

- Eventos do mesmo tipo no mesmo dia → colapsar: "Revisou 3 sessões de Python (2h total)"
- Dias consecutivos sem atividade → "3 dias sem atividade" placeholder

### Heatmap de contribuição

- GitHub-style no topo da página `/activity`
- Cor = total de eventos (qualquer tipo) por dia
- Hover: "5 maio — 3 sessões de estudo, 20 pág lidas, 1 entrada no diário"
- 52 semanas de histórico

### Privacy por design

- Feed visível apenas para o próprio user (sem social por default)
- Sharing futuro: opt-in por bloco temporal (task 69 - shareable profile)
- Eventos de `journal` com flag `private=true` excluídos do feed compartilhado

## Arquivos

- `src/app/activity/page.tsx` — feed principal
- `src/components/activity/ActivityFeed.tsx` — lista de eventos agrupados
- `src/components/activity/ContributionHeatmap.tsx` — heatmap anual
- `src/lib/activity/eventFormatter.ts` — evento → texto legível
- `src/app/api/activity/route.ts` — GET feed paginado + GET heatmap data
- `src/lib/db/sqlite.ts` — getActivityFeed, getContributionData

## Validação

- [ ] Feed mostra eventos de todos os módulos em ordem cronológica
- [ ] Agrupamento: 5 chunk reviews em 1h → 1 item agregado no feed
- [ ] Heatmap: 365 dias sem query > 200ms
- [ ] Dia sem atividade: placeholder "X dias sem atividade" aparece corretamente
- [ ] Journal entry com `private=true` não vaza para view de compartilhamento

## Decisões pendentes

- Feed infinito (scroll) ou paginado (semanas)? — paginado por semana
- Milestones (100 chunks, 10 livros): hardcoded ou configurável?
- Exportar feed como JSON/markdown para o user?
