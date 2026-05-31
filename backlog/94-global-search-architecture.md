---
prioridade: 94
categoria: feature,architecture,performance
esforco: 3 dias
risco: alto
dependencias: [83-domain-model-pluggable-topics, 84-internal-event-bus, 17-fts5-search]
---

# Global search — search-first architecture

## Contexto

Meta-épico 09. Busca global desde cedo. Construir depois = retrabalho total. Com chunks, livros, journal, notas e agenda, o user precisa de "me mostra tudo sobre Redis" e receber resultados de todos os módulos.

## Problema

Busca adicionada por último:
- Cada módulo tem sua própria busca isolada (LIKE em cada tabela separada)
- Sem ranking cross-módulo
- Sem busca semântica (apenas keyword)
- Sem deduplicação de resultados relacionados

## Proposta

### Índice unificado

```sql
-- Tabela de índice cross-módulo
CREATE VIRTUAL TABLE search_index USING fts5(
  entity_type,     -- 'chunk' | 'book' | 'journal_entry' | 'journal_note' | 'book_highlight'
  entity_id,       -- id na tabela de origem
  user_id UNINDEXED,
  title,           -- texto principal (front do chunk, título do livro, data da entry)
  body,            -- texto secundário (back do chunk, trecho do livro, body da entry)
  tags,            -- JSON array de tags/categorias
  domain_slug UNINDEXED,    -- domínio de estudo ou módulo
  indexed_at UNINDEXED,
  tokenize='trigram'   -- trigram para busca parcial (ex: "dist" acha "distributed")
);
```

### Indexação via event bus

```typescript
// subscriber registrado em eventBus
eventBus.on('study.chunk.created', ({ chunkId }) => indexChunk(chunkId));
eventBus.on('journal.entry.saved',  ({ entryDate }) => indexJournalEntry(entryDate));
eventBus.on('reading.book.added',   ({ bookId }) => indexBookMetadata(bookId));
```

Sem polling. Índice sempre atualizado via eventos.

### API de busca

```
GET /api/search?q=redis&modules=study,journal&limit=10
```

Response:
```json
{
  "query": "redis",
  "results": [
    { "type": "chunk",         "id": 42,   "title": "O que é Redis?",           "snippet": "...cache in-memory...", "domain": "backend", "score": 0.95 },
    { "type": "journal_entry", "id": "2026-05-20", "title": "2026-05-20",       "snippet": "...estudei Redis hoje...", "score": 0.82 },
    { "type": "book_highlight","id": 7,    "title": "Designing Data Systems p.89", "snippet": "...Redis uses...",    "score": 0.71 }
  ],
  "total": 3
}
```

### Command palette integration (task 57)

- Cmd+K abre command palette
- Busca em tempo real enquanto digita (debounce 200ms)
- Resultados agrupados por tipo
- Enter → navega para o recurso

### Busca semântica (fase 2, não bloqueia)

- FTS5 trigram para launch (fase 1)
- Embeddings + vector search (SQLite-vec ou pgvector futuro) para "encontrar ideias relacionadas"
- Fase 2 não bloqueia launch da busca keyword

### Busca com filtros

```
redis type:chunk domain:backend
redis @2026-05 type:journal
tag:estudo feito:true period:last7d
```

Parser de query DSL (compartilha lógica com text command engine, task 98).

## Arquivos

- Migration: `search_index` FTS5 virtual table
- `src/lib/search/indexer.ts` — funções de indexação por tipo
- `src/lib/search/queryParser.ts` — parse de filtros e operadores
- `src/lib/search/ranker.ts` — scoring cross-módulo
- `src/app/api/search/route.ts` — endpoint principal
- `src/components/search/GlobalSearch.tsx` — UI com command palette
- `src/lib/events/subscribers/searchIndexer.ts` — subscriber do event bus

## Validação

- [ ] Busca "redis" retorna resultados de chunks + journal + livros na mesma query
- [ ] Novo chunk criado → aparece nos resultados em < 1s
- [ ] Filtro `type:journal` exclui chunks e livros
- [ ] FTS5 trigram: busca parcial "dist" encontra "distributed"
- [ ] 1000 entradas indexadas → query em < 100ms
- [ ] Índice reindexável: `npm run search:reindex` reconstrói sem downtime

## Decisões pendentes

- Reindexação full na primeira vez: batch ou por trigger de migration?
- Busca semântica fase 2: SQLite-vec (local) ou API externa?
- Privacidade: search_index contém corpo das entradas — criptografar em repouso?
