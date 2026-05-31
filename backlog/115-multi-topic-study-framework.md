---
prioridade: 115
categoria: module,learning-engine,feature
esforco: 3-4 dias
risco: alto
dependencias: [37-multi-target-language, 19-migration-runner]
---

# Multi-topic study framework — estudo dinâmico além de línguas

## Contexto

Hoje o sistema é restrito a línguas (EN, PT, FR, ES). Usuário quer estudar linguagens de programação, matemática, história — qualquer domínio. Esta task cria o framework genérico de tópicos que sustenta 116, 117, e 118.

## Problema

- Schema atual assume chunks = segmentos de língua natural
- Study modes (pronunciation, dictation, feynman) são língua-específicos
- Sem como adicionar tópico novo sem modificar código

## Proposta

### Conceito: Topic
Um **topic** define um domínio de estudo. Cada topic tem:
- `type`: `language | programming | science | custom`
- `study_modes_allowed`: lista dos modos disponíveis para esse tipo
- `chunk_schema`: qual schema de dado um "chunk" tem nesse tópico (term/definition, question/answer, code snippet/explanation)

### Schema
```sql
CREATE TABLE topics (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,              -- ex: 'en-language', 'python', 'calculus'
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('language','programming','science','custom')),
  native_language TEXT,                  -- para language topics: 'pt', 'en', etc.
  study_modes TEXT NOT NULL DEFAULT '[]', -- JSON array: ['flashcard','quiz','feynman',...]
  chunk_schema TEXT NOT NULL DEFAULT '{"front":"text","back":"text"}', -- JSON schema
  icon TEXT,                             -- emoji ou nome de ícone
  created_by INTEGER REFERENCES users(id), -- null = sistema
  is_public BOOLEAN DEFAULT FALSE,
  created_at INTEGER NOT NULL
);

-- chunks ganha topic_id, substitui language_code para tópicos não-língua
ALTER TABLE chunks ADD COLUMN topic_id INTEGER REFERENCES topics(id);

-- user_progress também ganha topic_id
ALTER TABLE user_progress ADD COLUMN topic_id INTEGER REFERENCES topics(id);
```

### Seeding de tópicos padrão
- `en-language` (type: language, modes: todos)
- `python` (type: programming, modes: flashcard, quiz, cloze — sem pronunciation/dictation)
- `javascript` (idem)

### Routing
- `/study/[topicSlug]` substitui `/study/language`
- Sessão de estudo recebe `topicSlug` → carrega modes disponíveis → adapta UI

### Mode compatibility matrix
| Mode | language | programming | science | custom |
|------|---------|-------------|---------|--------|
| flashcard | ✓ | ✓ | ✓ | ✓ |
| quiz | ✓ | ✓ | ✓ | ✓ |
| cloze | ✓ | ✓ | ✓ | config |
| feynman | ✓ | ✓ | ✓ | config |
| pronunciation | ✓ | ✗ | ✗ | config |
| dictation | ✓ | ✗ | ✗ | config |
| audio | ✓ | ✗ | ✗ | config |

### Backward compatibility
- Todos os chunks existentes recebem `topic_id` do tópico `en-language` via migration
- `learning_language` em `user_settings` mapeia para `topic.slug` (alias)

## Arquivos

- Migration: `topics`, alterar `chunks` e `user_progress`
- `src/lib/db/sqlite.ts` — getTopics, createTopic, getTopicBySlug
- `src/app/api/topics/route.ts` — GET (list), POST (create custom)
- `src/features/study/domain/studyModeMatrix.ts` — tabela de compatibilidade
- `src/app/study/[topicSlug]/page.tsx` — rota genérica de estudo
- `src/lib/contexts/TopicContext.tsx` — topic ativo global

## Validação

- [ ] Migration: chunks existentes mantêm dados, ganham `topic_id` correto
- [ ] `GET /api/topics` retorna tópicos do user + públicos
- [ ] Routing `/study/python` carrega modes corretos (sem pronunciation)
- [ ] Criar tópico custom funciona sem modificar código
- [ ] SM-2 funciona identicamente para qualquer topic

## Decisões pendentes

- `chunk_schema` por tópico: validar com Zod no server ou apenas no client?
- Tópicos públicos (criados por outros users): escopo futuro ou parte desta task?
- `user_settings.learning_language`: manter como alias ou deprecar?
