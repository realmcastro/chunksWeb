---
prioridade: 72
categoria: feature,interactive
esforco: 3-4 dias
risco: alto
dependencias: [80-ai-tutoring-chat]
---

# Conversational practice page (AI dialogue interactive)

## Contexto

Item 80 (AI tutoring chat) é generic chat. Esta é uma **página de prática estruturada**: AI simula scenario (job interview, restaurante, aeroporto), user pratica responses, AI corrige + score.

## Problema

- User precisa output produção (não só recall) — gap entre conhecer chunks e usá-los
- Sem oportunidade de errar safe-space + receber feedback
- Speaking/conversational skill subdesenvolvido

## Proposta

### Página `/practice/conversation`

#### Setup
- Choose scenario: airport, restaurant, job interview, doctor visit, dating, business meeting, casual chat
- Choose difficulty: A1/A2/B1/B2/C1/C2 (CEFR)
- Choose role: customer/employee/etc.
- Optional: target chunks (must use chunks que user is reviewing)

#### Live conversation
- AI message (bubble esquerda)
- User input (textarea + send button OR voice via item 70)
- AI response inclui:
  - Continued dialogue
  - Inline corrections (if errors) — subtle red underline + tooltip explanation
  - Vocabulary suggestion (target chunk highlighted "💡 Try 'figure out'")

#### Real-time feedback layer
- Background analysis per user message:
  - Grammar errors (lightweight: rule-based + LLM)
  - Naturalness score (LLM)
  - Chunk usage tracking (which target chunks fired)
- Sidebar updates: "Naturalness: 87%", "Chunks used: 3/5"

#### Session end
- Summary: messages exchanged, errors caught + categorized
- Replayable: review entire conversation com corrections highlighted
- Chunks unlocked / progressed (treat usage = practice = SM-2 quality 3+)
- Suggested follow-up scenarios

### Streaming + UX
- AI response streams (SSE / fetch streaming) — feel natural
- Typing indicator
- Hint button: "Stuck? Show me what to say"
- Translate user message (toggle): see EN if user typed in native

### Speech mode
- User holds spacebar to speak (item 70 recording integrado)
- Whisper API ou Web Speech recognition → text → send
- AI replies via TTS (item 42 voice settings)
- Hands-free conversation possible

### Persistence
```sql
CREATE TABLE practice_conversations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  scenario TEXT,
  difficulty TEXT,
  language_code TEXT,
  started_at INTEGER,
  ended_at INTEGER,
  message_count INTEGER,
  naturalness_avg REAL,
  errors_caught INTEGER,
  target_chunks TEXT,    -- JSON array of chunk_ids
  chunks_used TEXT       -- JSON array of chunk_ids actually used
);

CREATE TABLE practice_messages (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER,
  role TEXT,             -- 'user' | 'assistant' | 'system'
  content TEXT,
  corrections TEXT,      -- JSON: errors + suggestions
  created_at INTEGER
);
```

### Caching prompt
- System prompt + scenario context cached (prompt caching item — claude-api skill)
- Per-conversation history fed as user messages

## Arquivos

- `src/app/practice/conversation/page.tsx`
- `src/app/practice/conversation/setup/page.tsx`
- `src/app/practice/conversation/[id]/page.tsx` — active session
- `src/app/practice/conversation/[id]/review/page.tsx` — replay
- `src/components/practice/ChatMessage.tsx`
- `src/components/practice/CorrectionTooltip.tsx`
- `src/components/practice/FeedbackSidebar.tsx`
- `src/app/api/practice/start/route.ts`
- `src/app/api/practice/message/route.ts` — streaming
- `src/app/api/practice/end/route.ts`
- `src/lib/ai/scenarios/` — prompts por scenario
- `src/lib/ai/correction-parser.ts` — extract corrections from LLM JSON output
- Migrations

## Validação

- [ ] Streaming response < 1s first token
- [ ] Corrections highlighted accurately (não false positives excessivos)
- [ ] Voice mode end-to-end < 3s round trip
- [ ] Session resume: refresh tab continua de onde parou
- [ ] Mobile responsive (chat layout)
- [ ] Token usage tracked per user (cost control)

## Decisões pendentes

- Model: Haiku (cheap, fast) vs Sonnet (quality)? Haiku para warmup, Sonnet para review.
- Rate limit: messages/day per user (cost control)?
- BYO API key option (user paga próprio Claude/OpenAI key)?
- Scenarios catalog: 10 inicial ou crowd-sourced?
- Correction sensitivity: aggressive (every error) vs lenient (major only)? User setting.
- Save conversations indefinitely vs auto-delete 90d?
