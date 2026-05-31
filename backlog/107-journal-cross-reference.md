---
prioridade: 107
categoria: feature,journal,ux
esforco: 2 dias
risco: médio
dependencias: [105-journal-module-schema, 106-journal-calendar-agenda]
---

# Journal cross-reference syntax — links dinâmicos entre entradas e eventos

## Contexto

O diário deve ser dinâmico: ao escrever, o user pode referenciar outros dias, metas, ou eventos do sistema (sessões de estudo, livros lidos). A sintaxe deve ser natural, digitável, e renderizar como link clicável.

## Problema

- Entradas são ilhas de texto sem conexão
- User quer dizer "hoje revisei o que escrevi em @2026-05-10" e ter um link real
- User quer marcar algo como "@executado: Terminei o capítulo 3 do livro X" e isso aparecer na view do dia referenciado

## Proposta

### Sintaxe de referência

| Sintaxe | Comportamento |
|---------|--------------|
| `@2026-05-10` | Link para a entrada daquele dia |
| `@ontem`, `@semana-passada` | Aliases relativos → resolve para data real |
| `@book:Título do Livro` | Link para o livro na biblioteca |
| `@goal:texto da meta` | Link para a goal (cria se não existir) |
| `@done: texto` | Registra item como "executado" — aparece no dia como `completed event` |
| `[[título de outra entrada]]` | Wikilink por título — resolve para a entrada com aquele título |

### Parsing
- Tiptap extension custom `JournalMention` processa tokens `@` e `[[`
- Preview inline: hover mostra tooltip com snippet da entrada referenciada
- Broken link (data sem entrada): link cinza com "Entrada não criada — clique para criar"

### Backlinks
- Ao salvar uma entrada com `@2026-05-10`, registrar em `journal_backlinks`:
```sql
CREATE TABLE journal_backlinks (
  id INTEGER PRIMARY KEY,
  source_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
  target_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
  link_type TEXT NOT NULL,   -- 'date_ref' | 'book_ref' | 'goal_ref' | 'done_event'
  created_at INTEGER NOT NULL,
  UNIQUE(source_entry_id, target_entry_id, link_type)
);
```
- Entrada referenciada exibe seção "Mencionado em:" com links reversos
- `@done:` backlink → dia fonte vê na sidebar "Este dia foi referenciado como executado em [data]"

### Eventos `@done:`
- Ao escrever `@done: Terminei o capítulo 3`, cria `journal_events`:
```sql
CREATE TABLE journal_events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
  event_text TEXT NOT NULL,
  event_type TEXT DEFAULT 'done',
  created_at INTEGER NOT NULL
);
```
- Calendário mostra dot diferenciado para dias com `done` events

## Arquivos

- `src/features/journal/domain/journalParser.ts` — parsing @-refs e [[wikilinks]]
- `src/features/journal/presentation/JournalMentionExtension.ts` — Tiptap extension
- Migration: `journal_backlinks`, `journal_events`
- `src/lib/db/sqlite.ts` — saveBacklinks, getBacklinks, getEventsByEntry
- `src/components/journal/BacklinksPanel.tsx` — "Mencionado em"

## Validação

- [ ] `@2026-05-10` renderiza como link, clique navega para a entrada
- [ ] `@ontem` resolve para data correta no momento do parse
- [ ] Backlinks são registrados ao salvar (não ao digitar)
- [ ] Broken link exibe texto cinza sem quebrar o editor
- [ ] `@done: texto` cria entry em `journal_events`
- [ ] Calendário exibe dot diferente para dias com done events

## Decisões pendentes

- `[[wikilinks]]`: busca por título exato ou fuzzy?
- Referências a entidades externas (sessões de estudo, chunks revisados)? — escopo futuro, não bloqueia agora
- Limite de backlinks por entry? (evitar loops de referência circular)
