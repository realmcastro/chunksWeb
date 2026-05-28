---
prioridade: 28
categoria: feature
esforco: 2-3 dias
risco: medio
---

# Cloze deletion mode

## Contexto

Study modes atuais: flashcard (show chunk → recall meaning), Feynman, vocabulary game. **Sem cloze (fill-in-the-blank)** — comprovadamente eficaz para retenção de chunks em contexto.

## Problema

- Recall passivo (flashcard) menos eficaz que active recall em contexto
- Exemplos existem (`examples` table) mas user não preenche gaps
- Aprendizado contextual subutilizado

## Proposta

### Modo de uso
- `/study/cloze` mode
- Para chunk "make up your mind", exemplo "I can't ___ ___ ___ where to eat":
  - Hide chunk words → user digita
  - Reveal + SM-2 quality (0-5 baseado em correto/quase/errado)

### Geração de cloze
**Opção A: automática** — extrair chunk_text de example.text_en (regex/match), substituir por `___`
**Opção B: pre-stored** — coluna `examples.cloze_text` (ex: "I can't ___ where to eat") + `cloze_answer` (ex: "make up my mind")

Hybrid: auto-generate Option A on read; cache em DB quando confirmado bom.

### Avaliação
- Match exato → quality 5
- Match com typo (Levenshtein ≤ 2) → quality 4 + show correção
- Sinônimo válido (lib de synonyms ou Claude API) → quality 3
- Errado → quality 1 + reveal

### UI
- Input com auto-resize
- Show example sentence, blanks marked clearly
- After submit: highlight matches + diff
- Self-grade override (button "I was right" / "I was wrong")

## Arquivos

- `src/app/study/cloze/page.tsx` (NEW)
- `src/components/study/ClozeSession.tsx` (NEW)
- `src/lib/cloze/generator.ts` — auto-extract
- `src/lib/cloze/evaluator.ts` — match + Levenshtein
- `src/app/api/cloze/next/route.ts` — return cloze + answer
- `src/app/api/cloze/submit/route.ts` — quality → SM-2

## Validação

- [ ] Cloze gerado preserva sentido (chunk completamente blank, contexto preservado)
- [ ] Typo aceito (Levenshtein) com feedback
- [ ] Self-grade override funciona
- [ ] Examples sem chunk match: skip ou fallback (raise to dev as data quality issue)
- [ ] Mobile keyboard: numeric/text adequado

## Decisões pendentes

- Sinônimos: lib local (WordNet, slow + heavy), Claude API (cost), ou desabilitar?
- Multi-blank em exemplo longo: 1 cloze ou múltiplos?
- Quality scale: SM-2 0-5 ou simplificar pass/fail?
