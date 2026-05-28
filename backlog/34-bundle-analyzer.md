---
prioridade: 34
categoria: performance,dx
esforco: 2h
risco: baixo
---

# Bundle analyzer setup

## Contexto

Sem visibilidade do bundle size. PWA caching agressivo amplifica custo de bundle inflado — primeiro install grande.

## Problema

- Sem baseline de tamanho de chunks JS
- Hard adicionar deps inadvertidamente pesadas (moment, lodash full, etc.)
- Sem alert quando bundle cresce > threshold

## Proposta

### Setup
```bash
npm install -D @next/bundle-analyzer
```

`next.config.js`:
```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(withPWA(nextConfig));
```

Script: `package.json`:
```json
"analyze": "ANALYZE=true next build"
```

### Budget
Definir em `.size-limit.json` ou check manual:
- First Load JS shared: < 100kb
- Per-route JS: < 50kb additional
- Largest chunk (i18n) flagged para dynamic import (já backlog item 91)

### CI integration
- Optional: `bundle-stats` ou `relative-ci` action para comentar em PR
- Fail se delta > 10%

## Arquivos

- `package.json` (script + dep)
- `next.config.js` (wrap)
- `.size-limit.json` (optional)
- `.github/workflows/ci.yml` (optional bundle check step)

## Validação

- [ ] `npm run analyze` gera report HTML
- [ ] Identificados top 5 chunks (esperado: i18n, next/image, react, lucide-react, others)
- [ ] Bundle delta em PR comentado (se CI integration adicionada)

## Decisões pendentes

- Treeshaking lucide-react: importar named (já é o caso) confirmar
- date-fns vs day.js? day.js menor (~7kb vs 70kb)
- Migrate to `lucide-react/icons/X` individual imports if size analysis shows bloat
