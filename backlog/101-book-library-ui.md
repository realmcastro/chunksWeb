---
prioridade: 101
categoria: feature,library,ux
esforco: 1-2 dias
risco: baixo
dependencias: [100-reading-module-schema]
---

# Book library UI — catálogo pessoal

## Contexto

Com o schema e storage prontos (100), o user precisa de uma interface para gerenciar sua biblioteca: adicionar livros, ver o que está lendo, remover.

## Problema

- Sem página de biblioteca — sem como o user ver/gerenciar seus livros
- Upload de arquivo exige UI clara com feedback de progresso
- Livros sem capa ficam sem identidade visual

## Proposta

### Rota
`/library` — página da biblioteca pessoal

### Layout
- **Grid view padrão**: cards com capa (ou placeholder geométrico por gênero/formato), título, autor, progresso %
- **List view toggle**: denso, bom para muitos livros
- **Filtros**: por formato, por idioma, "lendo agora" (last_read < 7 dias), "não iniciados"
- **Busca** full-text em título/autor (FTS5 se item 17 implementado, senão LIKE)

### Upload
- Dropzone (`<input type="file" accept=".pdf,.epub,.mobi,.txt">`) + drag-and-drop
- Campos: título (auto-parse do filename), autor, idioma
- Progress bar de upload (chunked multipart)
- Extração automática de metadados (epub tem metadata embutida; PDF via pdf-parse)

### Ações por livro
- "Continuar lendo" → abre reader na última página (102)
- "Ver detalhes" → modal com metadata + estatísticas de leitura
- "Remover" → soft delete + confirmação

### API
- `GET /api/books` — lista com progresso agregado
- `POST /api/books/upload` — multipart upload + save
- `DELETE /api/books/[id]` — soft delete

## Arquivos

- `src/app/library/page.tsx` — Server Component, lista livros
- `src/app/library/LibraryGrid.tsx` — Client, grid/list toggle
- `src/app/library/BookUploadDropzone.tsx` — Client, upload
- `src/app/api/books/route.ts` — GET + POST
- `src/app/api/books/[id]/route.ts` — DELETE
- `src/lib/db/sqlite.ts` — getBooks, addBook, softDeleteBook

## Validação

- [ ] Upload 10MB PDF funciona sem timeout
- [ ] Progresso de leitura aparece corretamente nos cards
- [ ] Filtro "lendo agora" filtra por last_read_at corretamente
- [ ] Drag-and-drop funciona em mobile (touch events)
- [ ] Capa placeholder distintos por formato

## Decisões pendentes

- Extração automática de capa de PDF? (pesado — exige render da primeira página)
- Limite de upload no formulário: 50MB ou configurável?
