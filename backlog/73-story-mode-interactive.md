---
prioridade: 73
categoria: feature,interactive
esforco: 3-5 dias
risco: medio
---

# Story mode (interactive narrative chunks)

## Contexto

Chunks aprendidos isoladamente. Sem context narrativo. Pesquisa: story-based learning + emotional engagement triplica retention vs lista decorrida.

## Problema

- Chunks descontextualizados → user esquece quando usar
- Sem hook emotional/narrative
- Sem aplicação imediata em contexto coeso

## Proposta

### Conceito
Stories: 5-15 min narrativas interativas. User escolhe decisions, chunks aprendidos triggadas naturalmente, AI gera responses contextual.

Exemplo: "Lost in Tokyo"
1. Open: "You're at Narita airport. Your phone died. You see a kiosk." 
2. Choice: [Ask for help] [Find Wi-Fi] [Look for taxi]
3. User picks → AI narra próxima cena com chunks-alvo embedded
4. Periodic challenges: complete sentence (cloze), pick correct chunk, speak phrase
5. Branching narrative — decisions afetam ending

### Story structure
```ts
interface Story {
  id: string;
  title: string;
  language: string;
  cefr_min: string;
  duration_min: number;
  chapters: Chapter[];
  required_chunks?: number[];  // chunks que devem aparecer
}

interface Chapter {
  narrative: string;       // markdown text or AI-generated
  challenge?: Challenge;   // cloze / mc / speak
  choices: Choice[];
  next?: string;           // chapter id ou conditional
}
```

### Generation
**Static stories**: hand-authored, content team
**Dynamic stories**: AI-generated (Claude) baseadas em user's chunks + level + interests (item 51 onboarding interests)

### Interactivity types
- Multiple choice (advance narrative)
- Cloze fill (gap em sentence)
- Speak (item 70 recording)
- Match chunk to meaning
- Reorder sentence words

### Visual
- Reader layout: large readable text, immersive
- Optional illustrations (Unsplash API ou DALL-E pre-gen)
- Choice buttons animate in
- Audio narration (TTS premium voice)
- Background ambient sound (airplane, restaurant) optional

### Progress tracking
```sql
CREATE TABLE user_stories (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  story_id TEXT,
  current_chapter TEXT,
  choices_made TEXT,     -- JSON path through tree
  chunks_encountered TEXT, -- JSON chunk_ids
  started_at INTEGER,
  completed_at INTEGER,
  rating INTEGER         -- post-story user rating 1-5
);
```

### Achievement integration
- Complete stories → badges (item 67)
- "Multilingual storyteller", "Plot Master" (all endings)

### Stories library
- `/stories` index — grid de stories disponíveis
- Filter: language, level, theme, duration
- Continue in progress
- Replay finished (different choices)

## Arquivos

- `content/stories/*.json` — static stories
- `src/app/stories/page.tsx` — library
- `src/app/stories/[id]/page.tsx` — reader
- `src/components/stories/StoryReader.tsx`
- `src/components/stories/ChoiceButtons.tsx`
- `src/components/stories/Challenge.tsx`
- `src/lib/stories/engine.ts` — state machine
- `src/lib/stories/ai-generator.ts` — dynamic generation
- `src/app/api/stories/save-progress/route.ts`
- Migration: `user_stories`

## Validação

- [ ] Branching: choice afeta narrative
- [ ] Resume: leave + return continues
- [ ] Cloze accurate (chunk extraction)
- [ ] TTS narration synced
- [ ] Mobile reading comfortable
- [ ] Dynamic AI stories coherent (test 5+ runs)
- [ ] Stories library filter funciona

## Decisões pendentes

- Authoring tool admin (item 75 + Claude) gera vs hand-curated stories?
- Multiplayer stories (item 80 chat + multi-user)? Defer big.
- Voice acting (multiple TTS voices for chars)?
- Premium stories paywall future? Open question.
