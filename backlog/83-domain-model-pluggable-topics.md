---
prioridade: 83
categoria: refactor,architecture,data
esforco: 3-4 dias
risco: crítico
dependencias: [19-migration-runner, 18-soft-delete-pattern]
---

# Domain model refactor — pluggable study domains

## Contexto

Meta-épico 09. O maior risco arquitetural do roadmap. Schema atual está hardcoded para línguas. Este refactor transforma o core em uma plataforma de domínios plugáveis antes das features dependentes.

## Problema

```sql
-- Hoje:
user_progress(user_id, chunk_id, ...)          -- chunk implicitamente é "idioma"
user_settings(learning_language TEXT, ...)      -- único domínio hardcoded
study_sessions(user_id, started_at, ...)        -- restrito a estudo de língua

-- Resultado: cada novo domínio força nova tabela ou columns nullable
```

## Proposta

### Abstração central: `study_domains`

```sql
CREATE TABLE study_domains (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('language','programming','science','math','custom')),

  -- Configuração do domínio (JSON)
  content_schema TEXT NOT NULL DEFAULT '{"front":"text","back":"text"}',
  enabled_modes TEXT NOT NULL DEFAULT '["flashcard","quiz"]',  -- JSON array
  sm2_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  spaced_repetition_algorithm TEXT DEFAULT 'sm2',  -- sm2 | fsrs | none

  -- Metadados
  icon TEXT,
  color TEXT,
  created_by INTEGER REFERENCES users(id),
  is_system BOOLEAN DEFAULT FALSE,   -- tópicos seed do sistema
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

-- Domínios do usuário (quais ele ativou)
CREATE TABLE user_domains (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  domain_id INTEGER NOT NULL REFERENCES study_domains(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  settings TEXT DEFAULT '{}',   -- overrides por user (ex: daily goal)
  added_at INTEGER NOT NULL,
  UNIQUE(user_id, domain_id)
);
```

### Migração de `chunks` e `user_progress`

```sql
-- chunks ganha domain_id (substitui language implícita)
ALTER TABLE chunks ADD COLUMN domain_id INTEGER REFERENCES study_domains(id);

-- Backfill: todos os chunks existentes → domain 'en-language'
UPDATE chunks SET domain_id = (SELECT id FROM study_domains WHERE slug = 'en-language')
WHERE domain_id IS NULL;

-- user_progress ganha domain_id explícito
ALTER TABLE user_progress ADD COLUMN domain_id INTEGER REFERENCES study_domains(id);
UPDATE user_progress SET domain_id = (SELECT id FROM study_domains WHERE slug = 'en-language')
WHERE domain_id IS NULL;
```

### Seeding de domínios sistema

```json
[
  { "slug": "en-language",  "type": "language",    "modes": ["flashcard","quiz","feynman","pronunciation","dictation","cloze","audio"] },
  { "slug": "python",       "type": "programming",  "modes": ["flashcard","quiz","feynman","cloze"] },
  { "slug": "javascript",   "type": "programming",  "modes": ["flashcard","quiz","feynman","cloze"] },
  { "slug": "sql",          "type": "programming",  "modes": ["flashcard","quiz","cloze"] }
]
```

### `user_settings.learning_language` deprecação

- Manter coluna por compatibilidade, mas queries passam a usar `user_domains`
- Migration cria `user_domains` row para cada `learning_language` existente
- Deprecar em 2 versões, remover após

### Importação/exportação por domínio

```typescript
// Schema versionado para import
interface DomainImport {
  version: 1;
  domain: string;          // slug do domínio
  schema_version: string;  // versão do content_schema
  chunks: Array<Record<string, unknown>>;  // validado pelo content_schema do domínio
}
```

## Arquivos

- Migration completa com backfill + rollback
- `src/lib/db/sqlite.ts` — getStudyDomains, getUserDomains, createDomain
- `src/features/study/domain/StudyDomain.ts` — tipo central
- `src/app/api/domains/route.ts` — CRUD de domínios
- `src/lib/seed/domains.ts` — seed idempotente dos domínios sistema
- Atualizar todas as queries que usam `language_code` → `domain_id`

## Validação

- [ ] Migration: zero perda de dados em `user_progress` e `chunks`
- [ ] Rollback da migration funciona sem corromper dados
- [ ] `en-language` domain seed existe após migration
- [ ] `user_settings.learning_language` ainda funciona (backward compat)
- [ ] Criar novo domínio via API: funciona sem alterar código de outros módulos
- [ ] SM-2 opera identicamente em qualquer domain_type

## Decisões pendentes

- `content_schema` validação: Zod dinâmico (runtime) ou JSON Schema? — JSON Schema + ajv
- Domínios públicos compartilháveis entre users? — schema suporta, feature em 97
- `spaced_repetition_algorithm: 'none'` para domínios sem SM-2 (ex: leitura livre): domínios de leitura não usam SR
