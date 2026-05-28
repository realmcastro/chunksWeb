---
prioridade: 90
categoria: performance
esforco: 4h
risco: baixo
---

# Image optimization (next.config + next/image audit)

## Contexto

`next.config.js`:
```js
images: { unoptimized: true, ... }
```

next/image sem optimization = sem WebP/AVIF, sem responsive srcset, sem lazy LCP otimização.

## Problema

- PNG/SVG carregam fullsize, mesmo em mobile
- Bandwidth gasto desnecessário
- LCP afetado por imagens grandes acima do fold

## Proposta

1. Mudar `unoptimized: false` em next.config.js
2. Verificar build: PWA + next-pwa compatível com optimization?
3. Audit usos: substituir `<img>` por `<Image>` onde aplicável
4. Adicionar `priority` em imagens acima do fold
5. Definir `sizes` para responsive

## Arquivos

- `next.config.js`
- Componentes com `<img>` direto (audit needed)
- Possivelmente `vocabulary/images` route (otimização server-side)

## Validação

- [ ] Build passes
- [ ] PWA offline ainda funciona com imagens otimizadas
- [ ] Lighthouse image score > 90
- [ ] LCP image carrega < 1.5s em 3G simulado

## Decisões pendentes

- **Verificar por que `unoptimized: true` foi setado originalmente** — pode ter razão (static export?)
- CDN para next/image cache? Vercel default ou self-host?
