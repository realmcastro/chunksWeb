---
prioridade: 36
categoria: compliance,ux
esforco: 1 dia
risco: baixo
---

# Cookie consent + privacy/terms pages

## Contexto

Sem `/privacy`, `/terms`. Sem cookie banner. GDPR/LGPD/CCPA requerem ambos para users EU/BR/CA.

## Problema

- Compliance risk: multa GDPR up to 4% global revenue
- Sem termos legais: liability exposure (data breaches, misuse)
- App PWA com cookies (session, future analytics) sem consent prompt

## Proposta

### Pages
- `src/app/privacy/page.tsx` — markdown rendered
- `src/app/terms/page.tsx` — markdown rendered
- Source markdown em `content/legal/privacy.md`, `terms.md` (versionado)
- Footer link em layout

### Cookie banner
- Component `CookieConsentBanner.tsx` — bottom toast (sonner-styled)
- Buttons: "Accept all" / "Essential only" / "Customize"
- Customize modal: granular toggles (essential, analytics, marketing future)
- Persistir consent em localStorage + cookie `consent_v1` (httpOnly false p/ JS read)
- Não mostrar banner para users com consent salvo

### Conditional loading
- Sentry, analytics, Web Vitals: load apenas após `consent.analytics === true`
- Essential (session, csrf): sempre carregam (legitimate interest)

## Arquivos

- `content/legal/privacy.md`, `terms.md`
- `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`
- `src/components/CookieConsentBanner.tsx`
- `src/lib/consent.ts` — get/set + load conditional
- `src/components/layout/Footer.tsx` (if not exists)

## Validação

- [ ] Banner aparece primeira visita
- [ ] Banner não reaparece após accept/decline
- [ ] Reset consent option (settings)
- [ ] Analytics não carrega antes de accept
- [ ] Pages legais traduzidas em 4 locales
- [ ] Versionamento: bump `consent_v` força re-prompt

## Decisões pendentes

- Privacy + terms: redigir interno ou usar template (TermsFeed, iubenda)?
- Banner UI: bottom bar vs full modal?
- Granularity: essential / analytics binary, ou full categorias (functional, performance, targeting)?
- Legal review antes publish? **Sim, recomendado**.
