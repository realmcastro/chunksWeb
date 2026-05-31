---
prioridade: 109
categoria: feature,journal,ux
esforco: 2-3 dias
risco: baixo
dependencias: [107-journal-cross-reference, 98-text-command-engine]
---

# Journal avançado — templates, queries, revisão semanal, snapshot, export

## Contexto

Com o core do diário pronto (105–108), esta task adiciona as camadas de produtividade: templates de entrada, sistema de queries para filtrar entradas, revisão semanal/mensal automática, snapshot diário do sistema, e export.

## Problema

- Abrir diário diariamente e começar do zero é atrito
- Sem forma de perguntar "o que eu fiz na semana passada?"
- Sem visão agregada de metas concluídas por semana
- Dados do diário presos dentro do sistema (sem export)

## Proposta

### Templates de entrada

```sql
CREATE TABLE journal_templates (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  body TEXT NOT NULL,          -- markdown com placeholders: {{data}}, {{dia_semana}}
  is_default BOOLEAN DEFAULT FALSE,
  created_at INTEGER NOT NULL
);
```

Templates padrão do sistema:
- **Diário padrão**: `## Intenções do dia\n\n## Aconteceu\n\n## Amanhã`
- **Revisão semanal**: `## O que fiz bem\n## O que melhorar\n## Próxima semana`
- **Retrospectiva mensal**: `## Conquistas\n## Desafios\n## Aprendizados`

Ao criar nova entrada: dropdown "Usar template" ou "Entrada em branco".

### Sistema de queries

No topo de `/journal`: campo de busca/filtro:

```
tag:estudo feito:true period:last7d
@meta: concluída:true
#python period:last30d
```

Usa command engine (98) + search (94). Retorna lista de entradas matching.

Casos de uso:
- "Ver tudo que marquei como `@feito:` esta semana"
- "Entradas com `#python` do último mês"
- "Dias em que completei todas as metas"

### Revisão semanal automática

- Todo domingo: notificação (ou badge no ícone do diário)
- `/journal/weekly-review/[YYYY-WNN]` — página gerada automaticamente com:
  - Resumo de `@feito:` da semana
  - Metas concluídas vs total
  - Horas de estudo (via tracking)
  - Livros lidos
  - Sugestão de template de revisão pré-preenchido

### Snapshot diário do sistema

Seção automática na entrada de cada dia (append, não substituir):

```markdown
---
📊 Snapshot de 31/05/2026
- Estudou: 45min Python (23 chunks)
- Leu: 18 páginas "Clean Code"
- Metas: 3/4 concluídas
- Streak: 12 dias
---
```

Gerado via event bus ao final do dia (midnight cron ou ao abrir o diário no dia seguinte).

### Undo / history de edições

```sql
CREATE TABLE journal_entry_history (
  id INTEGER PRIMARY KEY,
  entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
  body_snapshot TEXT NOT NULL,
  saved_at INTEGER NOT NULL
);
```

- Snapshot automático a cada save (debounce 30s, máx 20 versões por entrada)
- UI: "Ver histórico" → lista de versões → "Restaurar esta versão"

### Export

- `GET /api/journal/export?format=markdown&from=DATE&to=DATE`
- `GET /api/journal/export?format=json`
- Output markdown: um arquivo por mês, estrutura de pasta por ano
- Inclui: body, goals, snapshot, tags, events

## Arquivos

- Migration: `journal_templates`, `journal_entry_history`
- `src/app/api/journal/export/route.ts`
- `src/app/api/journal/weekly-review/[weekId]/route.ts`
- `src/components/journal/TemplateSelector.tsx`
- `src/components/journal/JournalQueryBar.tsx`
- `src/components/journal/WeeklyReviewPage.tsx`
- `src/components/journal/EntryHistory.tsx`
- `src/lib/journal/snapshotGenerator.ts` — lê eventos do dia e gera texto do snapshot

## Validação

- [ ] Template aplicado a nova entrada preserva placeholders resolvidos ({{data}} → "31 de maio")
- [ ] Query `tag:python period:last30d` retorna apenas entradas com #python nas últimas 4 semanas
- [ ] Snapshot diário: dados de tracking e estudo corretos
- [ ] History: restaurar versão anterior substitui body atual
- [ ] Export markdown: estrutura de pasta válida, sem entradas corrompidas

## Decisões pendentes

- Weekly review: trigger automático (midnight job) ou manual?
- Export: zip file ou download de arquivos individuais?
- History: quantas versões manter por entrada?
