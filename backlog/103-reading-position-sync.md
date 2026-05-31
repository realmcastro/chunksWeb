---
prioridade: 103
categoria: feature,library,pwa
esforco: 0.5 dia
risco: baixo
dependencias: [102-in-browser-reader]
---

# Reading position persistence — sync cross-device

## Contexto

A posição de leitura já é salva via `reading_progress` (schema 100) e atualizada pelo reader (102). Esta task foca na experiência de "continue lendo" — o user abre o celular e o sistema o coloca exatamente onde parou.

## Problema

- Sem indicação visual clara de "onde você parou" fora do reader
- Library card mostra % mas não convida para continuar
- Sem "reading now" widget para acesso rápido

## Proposta

### "Continue lendo" widget
- Componente `CurrentlyReading` na homepage/dashboard
- Mostra: capa, título, "Página 47 de 312", progresso bar, botão "Continuar"
- Máximo 3 livros com last_read_at mais recente

### Biblioteca: estado por card
- Card com `last_read_at` < 24h → badge "Lendo agora"
- Card nunca aberto → badge "Não iniciado"
- Card com completion_pct ≥ 95% → badge "Concluído"

### API cross-device
- `GET /api/books/[id]/progress` → `{ current_page, total_pages_rendered, last_read_at }`
- Já implementado em 102 — esta task foca no widget e nos badges, não na API

### Offline (PWA)
- `reading_progress` cacheada no IndexedDB via Dexie
- Sincroniza com servidor quando online
- Reader funciona offline (páginas já renderizadas cacheadas)

## Arquivos

- `src/components/reading/CurrentlyReading.tsx` — widget dashboard
- `src/lib/db/dexie.ts` — adicionar store `readingProgress`
- Hooks: `useReadingProgress(bookId)` — abstrai fetch + cache local

## Validação

- [ ] Abrir livro em desktop, fechar, abrir no celular → mesma página
- [ ] Widget "Continuar" aparece na home com progresso correto
- [ ] Badge de status correto para cada estado (lendo/não iniciado/concluído)
- [ ] Offline: reader abre na última página sem conexão

## Decisões pendentes

- Dashboard home: onde exatamente aparece o widget "Continue lendo"?
- Conflict resolution: user leu em dois devices sem sync — qual posição ganha?
