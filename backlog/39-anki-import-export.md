---
prioridade: 39
categoria: feature
esforco: 2-3 dias
risco: medio
---

# Anki .apkg import / export

## Contexto

Anki é o spaced-repetition tool dominante. User com decks Anki existentes não tem onboarding fácil para ChunksWeb. Reciprocamente, user que sai não consegue exportar.

## Problema

- Friction adquirir users que vêm de Anki
- Lock-in: user não pode sair com seus dados → desconfiança
- Sem path para conteúdo compartilhado (Anki Shared Decks ecosystem)

## Proposta

### Import .apkg
- Apkg = zip com SQLite + media files
- Lib: parsing manual (apkg structure documented) ou `anki-apkg-parser` (verify mantido)
- Mapper: Anki note fields → chunk_text + meaning + examples
- Strategy: prompt user para mapear fields (preview UI)
- SM-2 state import: factor, interval, repetitions → user_progress

### Export
- Gerar zip Anki-compatible
- Inclui chunks + examples + user_progress (SM-2 state)
- Card template: front/back simples

### UI
- `/settings/import-export` page
- Drag-drop apkg file
- Preview mapper + confirm
- Download .apkg de own data

## Arquivos

- `src/lib/anki/parser.ts` (parse apkg)
- `src/lib/anki/exporter.ts`
- `src/app/api/import/anki/route.ts`
- `src/app/api/export/anki/route.ts`
- `src/app/settings/import-export/page.tsx`

## Validação

- [ ] Import deck pequeno (50 cards) funciona
- [ ] Import deck grande (10K cards) em background
- [ ] Mapping preview correto
- [ ] Export round-trip: import → export → import = mesmos dados
- [ ] Media files (audio in Anki) preservados ou skipped graciosamente

## Decisões pendentes

- Tier 1 (basic notes) only ou cloze type também?
- Media files: import (storage cost) ou skip?
- License Anki shared decks: redistribuir requer atenção (most are CC-BY-SA).
