---
prioridade: 100
categoria: module,library,data
esforco: 2 dias
risco: médio
dependencias: [19-migration-runner]
---

# Reading module — schema + database storage strategy

## Contexto

Usuário possui livros em PDF/MOBI/EPUB baixados localmente. Objetivo: integrar leitura ao sistema como módulo do LifeOS, permitindo persistência completa da biblioteca, progresso e sincronização entre dispositivos.

Base estrutural para tarefas 101–104.

## Problema

- Sem schema para livros/ebooks no banco
- Sem estratégia definida para armazenamento binário
- Sem conceito de biblioteca pessoal ligada ao `userId`
- Sem persistência centralizada de leitura

## Proposta

### Schema

```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY,

  user_id INTEGER NOT NULL REFERENCES users(id),

  title TEXT NOT NULL,
  author TEXT,

  format TEXT NOT NULL
    CHECK(format IN ('pdf','epub','mobi','txt')),

  file_blob BLOB NOT NULL,
  mime_type TEXT NOT NULL,

  original_filename TEXT,
  file_size_bytes INTEGER NOT NULL,

  cover_image_blob BLOB,

  total_pages INTEGER,
  language TEXT DEFAULT 'pt',

  isbn TEXT,

  added_at INTEGER NOT NULL,
  updated_at INTEGER,
  deleted_at INTEGER,

  UNIQUE(user_id, title, author)
);

CREATE TABLE reading_progress (
  id INTEGER PRIMARY KEY,

  user_id INTEGER NOT NULL
    REFERENCES users(id),

  book_id INTEGER NOT NULL
    REFERENCES books(id),

  current_page INTEGER NOT NULL DEFAULT 0,

  total_pages_rendered INTEGER,

  last_read_at INTEGER NOT NULL,

  completion_pct REAL GENERATED ALWAYS AS (
    CASE
      WHEN total_pages_rendered > 0
      THEN CAST(current_page AS REAL)
           / total_pages_rendered * 100
      ELSE 0
    END
  ) STORED,

  UNIQUE(user_id, book_id)
);
```

### Estratégia de armazenamento

- Arquivos armazenados diretamente no banco via `BLOB`
- Nunca serializar para Base64
- Upload via API multipart
- Backend converte payload binário → `BLOB`
- Arquivo recuperado via stream/response autenticada
- Sem dependência de `storage/`, S3 ou filesystem local

### Justificativa arquitetural

Para um software pessoal (single-user / low-scale):

- Simplifica backup do sistema
- Facilita sincronização entre dispositivos
- Permite export/import completo do LifeOS
- Reduz moving parts operacionais
- Evita inconsistência entre banco ↔ filesystem

Tradeoff aceito:

- Banco crescerá com o tempo
- Queries devem evitar retornar `file_blob` desnecessariamente

**Regra obrigatória:** nunca fazer `SELECT *` em `books`.

Sempre excluir blobs quando não forem necessários:

```sql
SELECT
  id,
  title,
  author,
  format,
  total_pages,
  added_at
FROM books;
```

### Considerações de performance

- `file_blob` deve ser carregado somente em endpoints de leitura/download
- Metadata e blob devem ser tratados separadamente na camada de acesso
- Evitar hydrate completo do objeto do livro em listagens
- Lazy loading do conteúdo binário

### Considerações de segurança

- `file_blob` nunca exposto em respostas públicas
- Acesso somente mediante auth check
- MIME validation server-side
- Não confiar em extensão do arquivo
- Validar magic bytes quando possível

### Limites

Configuração inicial:

- Máx. 50MB por arquivo
- Máx. 500 livros por usuário

Valores configuráveis via env.

## Arquivos

- Migration: `books`, `reading_progress`
- `src/lib/db/sqlite.ts` — CRUD books + progress
- `src/app/api/books/` — upload/list/read/delete
- `src/lib/books/` — helpers de stream + metadata

## Validação

- [ ] Migration cria tabelas corretamente
- [ ] Upload persiste BLOB no banco
- [ ] Biblioteca lista metadata sem blob
- [ ] Reader recupera conteúdo corretamente
- [ ] Progress sync funciona entre dispositivos
- [ ] `SELECT *` proibido para `books`
- [ ] Soft delete respeitado (`deleted_at IS NULL`)

## Decisões pendentes

- Extração automática de metadata (autor/título/capa)?
- Compressão opcional de PDFs grandes?
- Indexação textual futura para search dentro do livro?
