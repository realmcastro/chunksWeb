---
prioridade: 108
categoria: feature,journal,ux
esforco: 0.5 dia
risco: baixo
dependencias: [105-journal-module-schema]
---

# Journal daily goals — intenções, metas, checklist por dia

## Contexto

`journal_goals` já existe no schema (105). Esta task é a UI dedicada: um checklist estruturado integrado ao editor de cada dia, fora do corpo livre de texto.

## Problema

- Goals escritas no corpo markdown são difíceis de rastrear como completadas
- Sem distinção entre "anotação livre" e "meta do dia"
- Sem visão de taxa de conclusão de metas ao longo do tempo

## Proposta

### UI no editor de entrada
- Seção separada "Intenções do dia" acima do corpo livre
- Lista de goals como checklist drag-reorderable
- Adicionar goal: input + Enter
- Cada goal: checkbox, texto, botão de remover
- Toggle completo → marca `completed_at`

### Goals de dias anteriores
- Ao criar nova entrada, opção "Trazer metas não concluídas de ontem" (auto-copy)
- Indicador: "2 metas não concluídas de ontem"

### Métricas de metas
- Calendar indicator: % completion do dia (ver task 106)
- Stats card: "Você completou 73% das suas metas nos últimos 30 dias"
- Streak de dias com 100% de metas concluídas

## Arquivos

- `src/components/journal/DailyGoalsList.tsx` — checklist drag-reorderable
- `src/app/api/journal/goals/route.ts` — POST goal
- `src/app/api/journal/goals/[goalId]/route.ts` — PATCH toggle, DELETE
- `src/lib/db/sqlite.ts` — getGoalsByEntry, createGoal, toggleGoal, reorderGoals

## Validação

- [ ] Adicionar goal + Enter foca no próximo input
- [ ] Toggle persiste imediatamente (optimistic + sync)
- [ ] Drag-and-drop reordena sem rerender excessivo
- [ ] "Trazer metas de ontem" copia apenas não concluídas
- [ ] Stat card de % correto

## Decisões pendentes

- Goals têm deadline intra-dia (ex: "antes das 18h")? — não por agora
- Categorias de goals (trabalho/pessoal/estudo)? — escopo futuro
