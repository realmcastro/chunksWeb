---
prioridade: 09
categoria: refactor,architecture,module
esforco: épico — ver sub-tasks
risco: crítico
dependencias: []
---

# Core Platform Refactor: Personal Knowledge & Study OS

## Contexto

ChunksWeb começou como app de idiomas. Não é mais. É um sistema pessoal de conhecimento com estudo multi-domínio, leitura, diário, agenda, tracking comportamental e knowledge graph. Continuar construindo features sobre o modelo atual (hardcoded para línguas) produz Frankenstein: migrations sofridas, lógica espalhada, CRUDs acoplados.

## O problema arquitetural

O modelo atual assume:

- "Estudar" = língua + SM-2 + chunks de texto
- "Progresso" = palavras memorizadas por idioma
- "Sessão" = study session de língua
- "Usuário" = alguém aprendendo inglês

Cada novo domínio (leitura, diário, programação) força hacks sobre esse modelo. O resultado sem refatoração: `user_progress` com colunas nullable por domínio, `study_sessions` reutilizado para leitura, lógica de tracking reinventada em cada feature.

## Visão correta

O sistema é um **Personal Knowledge & Study OS** com módulos plugáveis:

```
Core Platform
├── Identity (auth, users, permissions)
├── Event Bus (eventos internos: study.completed, book.page.changed, journal.entry.saved)
├── Tracking Engine (sessions, active/idle, bruto/líquido, por módulo)
├── Search Engine (índice unificado: chunks, livros, journal, notas)
└── Modules (plugáveis, cada um declara: schema, eventos, modos, métricas)
    ├── Study (tópicos de estudo: línguas, programação, etc.)
    ├── Reading (biblioteca, reader, posição, highlights)
    ├── Journal (diário, agenda, goals, cross-references)
    └── [futuros módulos]
```

## Sub-tasks obrigatórias (criar fundação antes das features)

| #   | Task                                     | Por quê                                      |
| --- | ---------------------------------------- | -------------------------------------------- |
| 83  | Domain model refactor — pluggable topics | Generaliza schema antes de adicionar dados   |
| 84  | Internal event bus                       | Tracking, streaks e analytics dependem disso |
| 94  | Global search architecture               | Busca por último = retrabalho total          |
| 98  | Text command engine (DSL inline)         | Diário + cross-references precisam de parser |
| 93  | Module permissions                       | Admins, automações e compartilhamento futuro |

## Features que dependem da fundação

| Feature                       | Bloqueada por                |
| ----------------------------- | ---------------------------- |
| Diário cross-references (107) | Text command engine (98)     |
| Activity feed (96)            | Event bus (84)               |
| Knowledge graph (97)          | Event bus (84) + search (94) |
| Tracking por módulo (110-112) | Event bus (84)               |
| Estudo multi-tópico (115-118) | Domain model refactor (83)   |

## Critério de saída do épico

- [x] Schema não tem coluna hardcoded para "idioma" — tudo é `domain_id` via `study_domains` (migration 0012)
- [x] Eventos internos fluem via event bus (`src/lib/events/eventBus.ts`) — review/submit já emite eventos
- [x] Busca retorna resultados de todos os módulos (`search_index` FTS5, `GET /api/search`)
- [x] Novo módulo adicionável sem alterar módulos existentes — `study_domains` + `registerTag()` + `registerCommand()`
- [x] Tracking funciona para qualquer seção via hooks genéricos — event bus + `domain_events` table
- [x] Novo nome OLife'S — concluído (renaming completo: UI, metadata, PWA, IndexedDB, localStorage, exports)

## Anti-padrão a evitar

Não implementar features visuais (feed, graph, dashboard) antes das tasks de fundação acima. Sem event bus, tracking vira polling manual. Sem domain model refactor, multi-tópico vira hack em cima de `learning_language`.
