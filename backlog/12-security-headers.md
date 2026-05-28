---
prioridade: 12
categoria: security
esforco: 4h
risco: medio
---

# HTTP security headers (CSP, HSTS, X-Frame-Options)

## Contexto

`next.config.js` não exporta `headers()`. PWA ativo mas nenhuma header de segurança aplicada. Middleware atual tem apenas check de `Sec-Fetch-Site` (frágil sem CSP).

## Problema

- Sem **Content-Security-Policy**: XSS reflected/stored explora sem barreira; scripts inline e remotos permitidos.
- Sem **HSTS**: downgrade attack possível em primeira visita; user pode ser MITM via HTTP.
- Sem **X-Frame-Options / frame-ancestors**: clickjacking via iframe possível.
- Sem **Referrer-Policy**: URLs internas vazam para sites externos.
- Sem **Permissions-Policy**: features sensíveis (microphone, geolocation) acessíveis se XSS.

## Proposta

Exportar `async headers()` em `next.config.js`:

```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'microphone=(self), geolocation=()' },
      { key: 'Content-Security-Policy', value: cspBuilder() },
    ],
  }];
}
```

CSP minimal:
- `default-src 'self'`
- `script-src 'self' 'nonce-{request-nonce}'` (next/script suporta nonce)
- `style-src 'self' 'unsafe-inline'` (Tailwind compila inline; restringir requer build mode)
- `img-src 'self' data: https://loremflickr.com https://live.staticflickr.com https://upload.wikimedia.org` (remotePatterns existentes)
- `connect-src 'self'` + Sentry DSN quando implementado
- `frame-ancestors 'none'`

## Arquivos

- `next.config.js` — adicionar `headers()` + helper `cspBuilder()`
- `src/middleware.ts` — gerar nonce per-request, injetar via header (next/script consome)

## Validação

- [ ] `curl -I https://...` mostra todas as headers
- [ ] `securityheaders.com` grade ≥ A
- [ ] PWA ainda instala (manifest, sw allowed pela CSP)
- [ ] Sentry funciona (connect-src inclui DSN)
- [ ] next/image carrega remotePatterns
- [ ] Inline scripts não-nonce bloqueados (verificar console)

## Decisões pendentes

- CSP **report-only** primeiro 1 semana antes de enforce? Recomendado: sim.
- Habilitar `upgrade-insecure-requests` ou aceitar dev http://localhost?
- `style-src unsafe-inline` vs build com nonce — Tailwind dev/prod difere.
