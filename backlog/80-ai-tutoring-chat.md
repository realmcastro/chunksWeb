---
prioridade: 80
categoria: feature
esforco: 3-4 dias
risco: medio
---

# AI tutoring chat (Claude API)

## Contexto

Feynman tool atual: usuário escreve explicação, sistema persiste com quality manual. Sem feedback automático, sem dialogue.

## Problema

- Feedback humano-curado não escala
- Sem correção contextual de erros gramaticais
- Sem prática conversacional

## Proposta

Novo módulo `src/lib/ai/`:

```
ai/
├── clients/
│   └── claude.ts          # Anthropic SDK wrapper com prompt caching
├── prompts/
│   ├── feynman-evaluator.md
│   ├── conversational-tutor.md
│   └── grammar-corrector.md
├── services/
│   ├── FeynmanEvaluator.ts  # avalia explicação → score + feedback
│   ├── ConversationalTutor.ts # chat ongoing
│   └── GrammarCorrector.ts  # corrige output de speaking practice
└── hooks/
    └── useAIChat.ts
```

Routes:
- `POST /api/ai/feynman/evaluate` — text → { score, feedback, errors[] }
- `POST /api/ai/chat` — message → response (streaming via SSE)

Prompt caching: system prompt + user level/history cached para reduzir custo.

## Validação

- [ ] First-message latency < 2s
- [ ] Streaming response funciona end-to-end
- [ ] Cache hit rate > 80% após N mensagens
- [ ] Custo por user/mês < $0.50 com sampling

## Decisões pendentes

- **Modelo**: `claude-haiku-4-5` (barato, fast) vs `claude-sonnet-4-6` (qualidade)?
- Rate limit per user (msgs/dia)?
- Histórico: armazenar últimas N mensagens em DB? Ou só client-side?
- Quem paga API key? Self-hosted: env var; SaaS: precisa BYO key ou cobrança.
