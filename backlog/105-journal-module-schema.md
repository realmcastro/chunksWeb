---
prioridade: 105
categoria: module,journal,data
esforco: 1.5 dias
risco: médio
dependencias: [19-migration-runner]
---

# Journal module — schema + CRUD de entradas diárias

## Contexto

Usuário quer um diário integrado ao sistema: anotações diárias, intenções, reflexões. Uma entrada por dia, mas múltiplos blocos dentro da entrada. Base para calendário (106) e cross-references (107).

## Problema

- Sem espaço para escrita livre dentro do sistema
- Vida organizada fragmentada em ferramentas externas (Notion, papel, etc.)
- Sem ligação entre o que o user faz no sistema e o que registra no diário

## Proposta

### Schema
```sql
CREATE TABLE journal_entries (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  entry_date TEXT NOT NULL,           -- 'YYYY-MM-DD', chave semântica
  title TEXT,                         -- opcional, ex: "Semana de prova"
  body TEXT NOT NULL DEFAULT '',      -- markdown rich text
  mood INTEGER CHECK(mood BETWEEN 1 AND 5),  -- 1=ruim … 5=ótimo (opcional)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  UNIQUE(user_id, entry_date)
);

CREATE TABLE journal_goals (
  id INTEGER PRIMARY KEY,
  entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0
);
```

### Invariantes
- Uma entry por dia por user (UNIQUE). Upsert on conflict.
- `entry_date` em UTC. UI converte para local para exibir.
- `body` é markdown — sanitizar antes de renderizar (sem XSS via dangerouslySetInnerHTML sem DOMPurify)

### API
- `GET /api/journal/[date]` — fetch ou 404 se não existe
- `PUT /api/journal/[date]` — upsert entry (cria ou atualiza)
- `GET /api/journal?from=YYYY-MM-DD&to=YYYY-MM-DD` — range para calendário
- `PATCH /api/journal/goals/[goalId]` — toggle completed

### Editor
- Rich text com suporte a Markdown (target: `@uiw/react-md-editor` ou `tiptap`)
- Autosave debounce 2s — sem botão "salvar" explícito

## Arquivos

- Migration: `journal_entries`, `journal_goals`
- `src/lib/db/sqlite.ts` — getJournalEntry, upsertJournalEntry, getJournalRange
- `src/app/api/journal/` — família de rotas
- `src/app/journal/[date]/page.tsx` — editor de entrada
- `src/features/journal/domain/journalTypes.ts`

## Validação

- [ ] Duas entradas no mesmo dia → upsert, não duplicata
- [ ] Autosave salva dentro de 3s após última tecla
- [ ] Body renderizado como markdown (não HTML raw)
- [ ] Soft delete funciona — entrada não aparece em queries
- [ ] Goals toggle atualiza completed_at corretamente

## Decisões pendentes

- Editor: `tiptap` (extensível) vs `react-md-editor` (simples)? — `tiptap` recomendado (suporta cross-reference nodes custom, 107)
- Mood tracker: obrigatório ou totalmente opcional?
- Exportar entradas como arquivo? (PDF, Markdown) — escopo futuro
