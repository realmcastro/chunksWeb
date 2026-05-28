---
prioridade: 33
categoria: seo,ux
esforco: 4-8h
risco: baixo
---

# SEO metadata, sitemap, robots, OG images

## Contexto

App é PWA learner-facing (não conteúdo público), mas landing/marketing/SEO ainda valem. Sem metadata custom por page, sem sitemap.xml, sem robots.txt customizado, sem OG images.

## Problema

- Share em Twitter/WhatsApp/Discord: preview genérico/quebrado
- Google não indexa páginas públicas
- Sem structured data → menos rich snippets

## Proposta

### Metadata
`src/app/layout.tsx` — default Metadata API:
```ts
export const metadata: Metadata = {
  title: { default: 'ChunksWeb', template: '%s · ChunksWeb' },
  description: 'Offline-first English fluency via chunks + spaced repetition.',
  openGraph: { /* ... */ },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.json',
};
```

Per-page overrides em `page.tsx` (login, browse, etc.).

### Sitemap
`src/app/sitemap.ts`:
```ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://...', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    // login, register, privacy, terms
  ];
}
```

### Robots
`src/app/robots.ts`:
```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/settings/'] },
    sitemap: 'https://.../sitemap.xml',
  };
}
```

### OG images (dynamic)
`src/app/opengraph-image.tsx`:
```ts
import { ImageResponse } from 'next/og';
export default function OG() {
  return new ImageResponse(<div>...</div>);
}
```

### Structured data
- JSON-LD em layout para Organization
- Per-chunk JSON-LD `LearningResource` (low priority)

## Arquivos

- `src/app/layout.tsx`
- `src/app/sitemap.ts` (NEW)
- `src/app/robots.ts` (NEW)
- `src/app/opengraph-image.tsx` (NEW)
- Per-page `metadata` export onde relevante

## Validação

- [ ] `curl /sitemap.xml` retorna XML válido
- [ ] `curl /robots.txt` retorna policy
- [ ] Twitter Card Validator: preview correto
- [ ] Lighthouse SEO score > 95
- [ ] OG image renderiza < 5s

## Decisões pendentes

- Indexar `/study`, `/browse` ou apenas marketing pages? **Apenas marketing** (study é authenticated).
- Domain canonical? Set BASE_URL env var.
