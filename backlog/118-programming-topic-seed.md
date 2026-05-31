---
prioridade: 118
categoria: feature,learning-engine,data
esforco: 1 dia
risco: baixo
dependencias: [117-study-modes-per-topic, 116-question-import-json]
---

# Programming language study topics — seed data + code snippet support

## Contexto

Com o framework pronto (115–117), esta task popula os primeiros tópicos de programação com conteúdo inicial e garante que code snippets renderizem corretamente em todos os modos.

## Problema

- Sistema vazio de conteúdo de programação no launch
- Code snippets precisam de syntax highlighting (diferente de texto puro)
- Sem exemplo de `chunk_schema` para código — outros developers não sabem como estruturar

## Proposta

### Tópicos seed

#### Python
- 80 flashcards cobrindo: tipos builtin, list/dict/set comprehensions, funções, classes, decorators, generators, async/await, stdlib comum (pathlib, json, os)
- `chunk_schema`: `{ "front": "text", "back": "markdown", "language": "python", "tags": "array" }`

#### JavaScript / TypeScript
- 80 flashcards: ES6+, Promise/async, array methods, closures, TypeScript types, React hooks FAQ
- `chunk_schema`: `{ "front": "text", "back": "markdown", "language": "typescript", "tags": "array" }`

#### SQL
- 40 flashcards: SELECT/JOIN/GROUP BY/subqueries/indexes/transactions
- `chunk_schema`: `{ "front": "text", "back": "markdown", "language": "sql", "tags": "array" }`

### Code snippet rendering
- Campo `back` com markdown → `prism-react-renderer` ou `shiki` para syntax highlighting
- Linguagem detectada pelo campo `chunk_schema.language` do tópico
- Copy button em blocos de código (UX padrão)
- Dark/light theme sincronizado com tema do sistema

### Seed delivery
- JSON files em `src/lib/seed/topics/` — não commitar como migration
- Script: `npm run seed:topics` → insere via API ou direto no DB
- Idempotente: skip se tópico já existe

### Chunk schema documentation
- `src/lib/seed/topics/README.md` → explica o formato JSON esperado por tipo de tópico
- Serve como guia para o user criar tópicos custom e para import (116)

## Arquivos

- `src/lib/seed/topics/python.json`
- `src/lib/seed/topics/javascript.json`
- `src/lib/seed/topics/sql.json`
- `src/lib/seed/topics/README.md`
- `src/lib/seed/seedTopics.ts` — script idempotente
- `src/components/study/CodeBlock.tsx` — wrapper com syntax highlight + copy
- `package.json` — adicionar script `seed:topics`

## Validação

- [ ] `npm run seed:topics` insere sem erro em DB vazio
- [ ] Rodando duas vezes: sem duplicatas
- [ ] Flashcard Python: bloco de código renderiza com syntax highlight
- [ ] Copy button copia código sem markdown delimiters
- [ ] Dark mode: highlight theme troca junto

## Decisões pendentes

- Seed em inglês ou português? — inglês (convenção de programação)
- Curadoria humana vs AI-gerado? — AI-gerado + revisão mínima para launch
- Atualizar seed com novos flashcards via PR comunitário? — escopo futuro
