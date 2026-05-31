---
prioridade: 116
categoria: feature,learning-engine,ux
esforco: 1.5 dias
risco: baixo
dependencias: [115-multi-topic-study-framework]
---

# Question/flashcard import — JSON bulk + input manual

## Contexto

Com topics dinâmicos (115), o user precisa de uma forma de popular um tópico com conteúdo. Esta task cria dois caminhos: import via JSON e criação manual chunk a chunk.

## Problema

- Sem import → user tem que criar centenas de flashcards um a um
- JSON é o formato natural para quem tem conteúdo gerado por AI ou exportado de outras ferramentas
- Sem validação de schema → import corrompido silenciosamente

## Proposta

### Formato JSON de import
```json
{
  "topic": "python",
  "version": 1,
  "chunks": [
    {
      "front": "O que é uma list comprehension?",
      "back": "Sintaxe compacta para criar listas: `[expr for item in iterable if condition]`",
      "tags": ["syntax", "lists"],
      "difficulty": 2
    }
  ]
}
```

Campos opcionais por chunk_schema do tópico. Campos extras ignorados (não rejeitados).

### Validação
- Zod schema gerado dinamicamente baseado em `topic.chunk_schema`
- Erro por linha: "chunk[14]: campo `back` obrigatório ausente"
- Preview: mostra primeiros 5 chunks antes de confirmar import
- Limite: 500 chunks por import (batches maiores → múltiplos arquivos)

### Import UI
- Dropzone `.json` em `/study/[topicSlug]/import`
- Textarea alternativa: colar JSON diretamente
- Dry run: validar sem salvar → exibe "483 válidos, 17 com erro"
- Confirmar → salva em batch (transação única)
- Duplicatas: detecta por hash(front + back) → skip ou overwrite (choice)

### Input manual
- Formulário em `/study/[topicSlug]/chunks/new`
- Campos gerados pelo `chunk_schema` do tópico
- Suporte a markdown no campo `back` (preview ao lado)
- Atalho: Enter → salvar + abrir novo form vazio

### API
- `POST /api/topics/[slug]/chunks/import` — batch JSON
- `POST /api/topics/[slug]/chunks` — chunk único

## Arquivos

- `src/app/study/[topicSlug]/import/page.tsx`
- `src/components/study/ImportDropzone.tsx`
- `src/components/study/ImportPreviewTable.tsx`
- `src/app/api/topics/[slug]/chunks/route.ts` — GET list, POST single
- `src/app/api/topics/[slug]/chunks/import/route.ts` — POST batch
- `src/lib/db/sqlite.ts` — importChunksBatch (transação)

## Validação

- [ ] Import de 200 chunks executa em < 3s (transação batch)
- [ ] Arquivo inválido: erros por linha, não falha silenciosa
- [ ] Duplicata com `overwrite=false`: chunk ignorado, contagem informada
- [ ] Manual: Enter salva e foca novo form
- [ ] Tópico programming: campo `back` com markdown renderiza preview correto

## Decisões pendentes

- Limite de 500 por import: aumentar? ou paginação de import?
- Importar de CSV também? (planilhas do Excel) — escopo futuro
- Importar de Anki .apkg? (task 39 já planeja isso)
