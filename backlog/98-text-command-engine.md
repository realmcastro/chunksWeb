---
prioridade: 98
categoria: module,architecture,feature
esforco: 3 dias
risco: médio
dependencias: [84-internal-event-bus]
---

# Text command engine — DSL inline e parser de referências

## Contexto

Meta-épico 09. Diário, agenda, journal e futuras notas precisam de um parser de tokens inline: `@2026-05-10`, `@feito:`, `#tag`, `[[wikilink]]`. Esta task cria o engine compartilhado — não reimplementar por módulo.

## Problema

- Sem parser centralizado: cada módulo reescre parsing de `@` e `#`
- Inconsistência: `@ontem` no diário não funciona em notas de livro
- Extensibilidade zero: adicionar novo token = modificar N arquivos

## Proposta

### Grammar do DSL

```
token       ::= date_ref | relative_ref | semantic_tag | entity_ref | wikilink | hashtag | command
date_ref    ::= '@' ISO_DATE                              -- @2026-05-31
relative_ref::= '@' RELATIVE                              -- @ontem @semana-passada @proximo-mes
semantic_tag::= '@' SEMANTIC ':' TEXT_UNTIL_DELIMITER     -- @feito: texto | @meta: texto | @erro: texto
entity_ref  ::= '@' ENTITY_TYPE ':' IDENTIFIER            -- @book:Clean-Code @chunk:42
wikilink    ::= '[[' TEXT ']]'                            -- [[Distributed Systems]]
hashtag     ::= '#' WORD                                  -- #estudo #python
command     ::= '/' WORD ARGS                             -- /template diario /query tag:python
```

### Semantic tags configuráveis

Não hardcoded. User (e sistema) registra handlers:

```typescript
commandEngine.registerTag('@feito', {
  description: 'Marca evento como executado',
  onParse: (text, context) => createJournalEvent({ type: 'done', text, entryDate: context.date }),
  render: (text) => <DoneTag text={text} />
});
```

Módulos registram seus handlers no boot.

### Parser incremental

- Não reparse o documento inteiro a cada keystroke
- Parse apenas a linha editada (cursor position)
- Resultado: AST parcial mergeado no AST existente

```typescript
interface ParsedToken {
  type: 'date_ref' | 'semantic_tag' | 'entity_ref' | 'wikilink' | 'hashtag' | 'command';
  raw: string;           -- texto original
  resolved?: unknown;    -- valor resolvido (ex: entryDate para date_ref)
  position: { start: number; end: number };
  status: 'resolved' | 'broken' | 'pending';
}
```

### Autocomplete

- `@` digitado → lista: datas recentes + semantic tags registradas
- `[[` digitado → busca FTS em títulos de entradas/livros/chunks
- `#` digitado → tags existentes do user
- Dropdown posicionado na posição do cursor (não modal)

### Resolver de links

```typescript
// Resolve referências para URLs internas
resolveToken('@2026-05-10')    // → '/journal/2026-05-10'
resolveToken('@book:Clean-Code') // → '/library/42'
resolveToken('[[Rust]]')       // → busca FTS → '/journal/2026-03-15' (primeira menção)
```

Links "quebrados" (sem destino) → render cinza + "Criar entrada" ao clicar.

### Query syntax (busca avançada no diário/search)

```
tag:python feito:true period:last30d
@2026-05 type:journal #estudo
```

Compartilha parser com sistema de busca global (94).

## Arquivos

- `src/lib/commands/commandEngine.ts` — registry + parser principal
- `src/lib/commands/grammar.ts` — definição da grammar
- `src/lib/commands/tokenResolver.ts` — resolve tokens para URLs/dados
- `src/lib/commands/incrementalParser.ts` — parse por linha
- `src/lib/commands/autocompleteProvider.ts` — sugestões por posição do cursor
- `src/lib/commands/queryParser.ts` — parse de filtros de busca
- `src/components/editor/TokenRenderer.tsx` — render de tokens no editor
- `src/components/editor/CommandAutocomplete.tsx` — dropdown de sugestões

## Validação

- [ ] `@2026-05-10` resolve para link de entrada do diário em < 50ms
- [ ] `@feito: comprei o livro` cria journal_event com texto correto
- [ ] `[[Redis]]` com entrada inexistente → render cinza, clique cria entry vazia
- [ ] Autocomplete de `[[` lista livros + chunks + entradas de diário
- [ ] Parse de documento 10k chars em < 10ms (benchmark)
- [ ] Novo handler registrado → sem alterar parser core

## Decisões pendentes

- Grammar: PEG parser (peg.js/peggy) vs regex manual?
  - **Recomendado: PEG** (regex manual não escala com grammar extensível)
- Tiptap extension vs editor próprio? — Tiptap extension (menos código, integração com 105)
- Comandos `/template` e `/query`: escopo desta task ou da task de cada módulo?
  - Engine registra os handlers; cada módulo implementa seu handler
