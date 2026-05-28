---
prioridade: 40
categoria: performance
esforco: 1 dia
risco: baixo
---

# Suspense streaming em rotas de estudo

## Contexto

Páginas críticas (`study/[mode]/page.tsx`, `chunk/[id]/page.tsx`) bloqueiam o render inteiro até toda query terminar. Sem `<Suspense>` boundaries.

## Problema

- TTI alto em primeira chunk de sessão
- Pronunciation engine (TTS/IPA/G2P) bundle bloqueia hidratação
- Examples + related chunks bloqueiam página inteira mesmo quando opcionais

## Proposta

1. Split página em RSC root + child components
2. Pronunciation: `dynamic(() => import('...'), { ssr: false })`
3. `<Suspense fallback={...}>` em:
   - Lista de exemplos
   - Related chunks
   - Audio player controls
4. `loading.tsx` em route segments quando aplicável

## Arquivos

- `src/app/study/[mode]/page.tsx`
- `src/app/chunk/[id]/page.tsx`
- `src/app/study/[mode]/loading.tsx` (novo)
- Componentes de pronunciation que devem ser lazy

## Validação

- [ ] Lighthouse: LCP < 2.5s em route study
- [ ] TBT redução > 30%
- [ ] Network waterfall: chunks de pronunciation carregam após paint
- [ ] Hidratação sem flash (CLS < 0.1)

## Decisões pendentes

- Skeleton vs spinner para fallback? **Skeleton (mantém layout estável)**
