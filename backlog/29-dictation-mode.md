---
prioridade: 29
categoria: feature
esforco: 2 dias
risco: baixo
dependencias: [70-audio-recording-module]
---

# Dictation mode (listening comprehension)

## Contexto

Pronunciation engine produz TTS para chunks. **Sem modo dictation** (audio → user types o que ouviu).

## Problema

- Listening skill não treinada explicitamente
- TTS subutilizada (apenas pronunciation reference)
- Skill gap: user lê chunk mas falha em compreensão auditiva

## Proposta

### Flow
1. TTS toca chunk (ou example)
2. User digita o que ouviu
3. Compare com original (Levenshtein + word-level diff)
4. Score + SM-2 quality

### Variantes
- **Easy**: chunk single
- **Medium**: example sentence
- **Hard**: example sentence em velocidade nativa (1.0x), sem hint

### UI
- Botão play (replay limit: 3× para desencorajar copy/cole)
- Variable speed slider (0.5x – 1.5x)
- Submit → diff visualization (vermelho missed, amarelo wrong, verde correct)
- TTS replay com word highlighting (após submit)

### Avaliação
- Word-level diff (lib `diff` ou implementação custom)
- Score = words correct / total words
- < 50%: quality 1; 50-75%: 3; 75-90%: 4; > 90%: 5

## Arquivos

- `src/app/study/dictation/page.tsx`
- `src/components/study/DictationSession.tsx`
- `src/lib/dictation/diff.ts`
- `src/app/api/dictation/next/route.ts`
- `src/app/api/dictation/submit/route.ts`

## Validação

- [ ] TTS replay limit funciona
- [ ] Speed slider afeta playback rate
- [ ] Diff destaca diferenças corretamente
- [ ] Mobile: input não ativa autocorrect (autoComplete=off, autoCorrect=off)
- [ ] Acessibilidade: visual diff + screen reader announce

## Decisões pendentes

- Replay limit por question (3) ou per session?
- Allow paste? Defaults: bloquear (paste = trivial copy from showed text).
- Accent variation: US/UK/AU voices selectable?
