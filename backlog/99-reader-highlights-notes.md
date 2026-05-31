---
prioridade: 99
categoria: feature,library,ux
esforco: 2 dias
risco: médio
dependencias: [102-in-browser-reader, 98-text-command-engine]
---

# Reader: highlights, notas por trecho, busca interna

## Contexto

Reader básico (102) cobre posição e leitura. Esta task adiciona a camada de anotação: highlight de trechos, notas por passagem, e busca dentro do livro. Integra com knowledge graph (97) e command engine (98).

## Problema

- Ler sem anotar = absorção passiva, menor retenção
- Highlights sem notas = contexto perdido ao revisitar
- Sem busca no livro: relembrar onde estava um trecho é impossível em 300 páginas
- Highlights isolados do diário e dos chunks de estudo

## Proposta

### Schema

```sql
CREATE TABLE book_highlights (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  book_id INTEGER NOT NULL REFERENCES books(id),
  page INTEGER NOT NULL,
  text_content TEXT NOT NULL,          -- trecho selecionado
  start_offset INTEGER,                -- byte offset no documento
  end_offset INTEGER,
  color TEXT DEFAULT 'yellow' CHECK(color IN ('yellow','green','blue','pink','purple')),
  note TEXT,                           -- anotação opcional sobre o trecho
  note_tokens TEXT,                    -- JSON: tokens parseados pelo command engine
  tags TEXT DEFAULT '[]',              -- JSON array de tags
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX idx_book_highlights_book_page ON book_highlights(book_id, page);
```

### Highlight UI (no reader)

- Selecionar texto no reader → toolbar: [Destacar amarelo | verde | azul | + Nota | Cancelar]
- Highlight persistido via `POST /api/books/[id]/highlights`
- Trechos já destacados: renderizados com `background-color` correspondente
- Hover no highlight: tooltip com nota (se existir)

### Editor de notas

- Clique em highlight existente → drawer lateral com:
  - Trecho original (readonly, com contexto ±2 linhas)
  - Campo de nota (markdown com command engine: `#tag`, `@chunk:42`)
  - Tags
  - Botão "Linkar a chunk" → cria edge no knowledge graph
- Autosave 1s

### Busca dentro do livro

- PDF: pdfjs tem texto extraído → indexar no `search_index` (94) com `entity_type='book_highlight'` + `entity_type='book_page'`
- EPUB: texto extraído do DOM do reader
- Query: `GET /api/books/[id]/search?q=redis` → lista de páginas com contexto
- UI: sidebar de resultados com jump-to-page

### Integração com knowledge graph

- Highlight com nota criado → `eventBus.emit('reading.highlight.created', { bookId, text, note })`
- Graph builder cria edge: `book → concept_tag` para cada `#tag` na nota
- Edge: `book_highlight → journal_entry` se nota contém `@DATE`

### Export de highlights

- `GET /api/books/[id]/highlights/export?format=markdown` → arquivo markdown com todos highlights + notas
- Formato:
  ```markdown
  ## Designing Data-Intensive Applications — Highlights

  **p. 89** [amarelo] #redis #cache
  > Redis uses in-memory storage for speed...
  *Nota: relaciona com o que vi no chunk 42 sobre caching*
  ```

## Arquivos

- Migration: `book_highlights`
- `src/app/api/books/[id]/highlights/route.ts` — CRUD
- `src/features/reader/presentation/HighlightToolbar.tsx` — toolbar de seleção
- `src/features/reader/presentation/HighlightNoteDrawer.tsx` — editor de nota
- `src/features/reader/hooks/useHighlights.ts` — fetch + optimistic update
- `src/app/api/books/[id]/search/route.ts` — busca interna
- `src/lib/events/subscribers/highlightGraphBuilder.ts`

## Validação

- [ ] Selecionar texto em PDF → toolbar aparece, highlight salvo com cor correta
- [ ] Highlights persistidos aparecem ao reabrir livro na mesma página
- [ ] Nota com `#python` → tag salva + edge no knowledge graph
- [ ] Export markdown: todos os highlights em ordem de página

## Decisões pendentes

- Offset por caractere (preciso) ou por posição relativa na página (menos preciso mas mais estável ao redimensionar)?
- Sync de highlights offline? — sim, via Dexie + background sync de 84
