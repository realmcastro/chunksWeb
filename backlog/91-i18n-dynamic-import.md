---
prioridade: 91
categoria: performance
esforco: 4h
risco: baixo
---

# i18n dynamic locale import

## Contexto

`src/lib/i18n/translations/` contém en/pt/es/fr.json (~10K keys cada). I18nProvider importa todos no bundle inicial.

## Problema

- Bundle inicial inflado (~4× tamanho de uma única locale)
- User vê apenas uma locale por vez

## Proposta

1. Dynamic import por locale:
   ```ts
   const messages = await import(`./translations/${locale}.json`);
   ```
2. Cache em memória após primeiro carregamento
3. Suspense boundary durante swap de locale
4. Pre-load locale do user no SSR (cookie / `Accept-Language`)

## Arquivos

- `src/lib/i18n/I18nProvider.tsx`
- `src/lib/i18n/loader.ts` (novo)

## Validação

- [ ] Bundle inicial reduz ~75% no chunk de i18n
- [ ] Switch de locale UX: < 100ms com cache
- [ ] First paint não bloqueia esperando JSON

## Decisões pendentes

- Pre-fetch outras locales no idle? Trade-off bandwidth vs UX
