---
prioridade: 95
categoria: performance
esforco: 1-2 dias
risco: baixo
---

# Memoization profile + targeted memo

## Contexto

100+ componentes, ~42 usos de `useMemo`/`useCallback`. Estratégia ad-hoc.

## Problema

- Memoization sem profile: pode estar memoizando coisa errada (premature optimization) e perdendo onde importa (study session hot path)
- Risk: inline objects em props causam re-render de tree inteira

## Proposta

1. React Profiler em rotas de estudo: identificar componentes que re-renderizam > 5×/segundo
2. Para cada hot component:
   - Verificar props instabilidade (inline objects, inline arrow fns)
   - Aplicar `React.memo` no componente filho
   - Mover `useCallback` em handlers do parent
   - `useMemo` em arrays/objects derivados de cálculo caro
3. Documentar trade-offs em comentários onde memo é não-óbvio

## Arquivos

- Componentes em `src/components/study/`
- Possivelmente `src/components/chunks/ChunkCard.tsx`
- `src/components/dashboard/DashboardClient.tsx`

## Validação

- [ ] React Profiler: hot components reduzem render count > 50%
- [ ] Lighthouse TBT reduz > 20% em study route
- [ ] Sem regressão de correção (manual smoke)

## Decisões pendentes

- Adotar `why-did-you-render` em dev mode? Útil mas adiciona dep
