---
prioridade: 70
categoria: module
esforco: 3 dias
risco: medio
---

# Módulo audio recording (speaking practice)

## Contexto

Pronunciation subsystem completo para output (TTS, IPA, G2P). Zero capability para input do usuário (gravação de fala).

## Problema

- Sem prática de speaking, usuário não treina output
- Pronunciation engine pode comparar IPA esperado vs gerado, mas não tem fonte de gerado real

## Proposta

Novo módulo `src/lib/pronunciation/recording/`:

```
recording/
├── engines/
│   ├── MediaRecorder.ts      # Web Audio API wrapper
│   └── SpeechRecognition.ts  # Web Speech API (fallback whisper)
├── hooks/
│   ├── useRecorder.ts        # gravação + cancel + stop
│   └── usePlayback.ts        # playback do recording
├── services/
│   ├── RecordingService.ts   # save/load/delete em IndexedDB
│   └── EvaluationService.ts  # compara user IPA vs target IPA
├── storage/
│   └── recordingsDB.ts       # Dexie schema (audioBlob, chunkId, score, createdAt)
└── ui/
    ├── RecordButton.tsx
    ├── WaveformVisualizer.tsx
    └── ScoreFeedback.tsx
```

Integração:
- ChunkCard ganha botão "Speak" → grava → compara → mostra score
- Settings: microphone permission, recording quality, retenção (default 30 dias)

## Validação

- [ ] Permission request flow correto (deny gracioso)
- [ ] Gravação > 5s funciona sem memory leak
- [ ] IndexedDB cleanup automático após retenção
- [ ] Score > 0.7 = badge "Confident" no chunk
- [ ] Mobile Safari compatibility (MediaRecorder quirks)

## Decisões pendentes

- Whisper API server-side ou Web Speech client-side? **Web Speech (free, no API key needed)**
- Comparação fonética: lib `levenshtein` em IPA strings, ou modelo dedicado?
- Limite de armazenamento: cap por user? IndexedDB ~50MB típico
