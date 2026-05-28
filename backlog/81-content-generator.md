---
prioridade: 81
categoria: feature
esforco: 2-3 dias (MVP API only)
risco: medio
dependencias: [75-admin-dashboard, 80-ai-tutoring-chat]
---

# Content generator (batch chunks via Claude API)

## Contexto

Chunks atuais inseridos manualmente no DB. Sem ferramenta para gerar em escala.

## Problema

- Catálogo limitado pelo trabalho humano
- Cobertura de tópicos (categorias, CEFR) desbalanceada
- Sem refresh sazonal de conteúdo

## Proposta

Módulo `src/features/content-gen/`:

```
content-gen/
├── application/
│   └── GenerateChunksUseCase.ts
├── domain/
│   ├── ChunkSpec.ts          # categoria + CEFR + count
│   └── GeneratedChunk.ts     # shape antes de persistir
├── infrastructure/
│   └── claude-generator.ts   # prompt + parse JSON output
└── presentation/
    ├── GenerateChunksForm.tsx
    └── PreviewList.tsx       # review humano antes de persistir
```

Workflow:
1. Admin escolhe categoria + count + CEFR
2. Claude gera N chunks com schema fixo (chunk_text, meaning, examples[])
3. Preview UI: admin aprova/edita/rejeita cada um
4. Bulk insert via `sqlite.ts`

Routes:
- `POST /api/admin/generate-chunks` — gate admin role
- `POST /api/admin/persist-chunks` — bulk insert aprovados

## Validação

- [ ] Output do Claude valida em Zod schema antes de mostrar
- [ ] Duplicate detection (não inserir chunks já existentes)
- [ ] Cost tracking por geração (log tokens + custo estimado)

## Decisões pendentes

- Quality gate automático? (ex: Claude segundo passo "review" o output do primeiro)
- IPA generation: pipeline existente (G2P) ou Claude?
- Audio: gerar TTS no momento ou on-demand?
