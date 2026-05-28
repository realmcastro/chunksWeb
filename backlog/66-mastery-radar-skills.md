---
prioridade: 66
categoria: feature,ux
esforco: 1-2 dias
risco: medio
dependencias: [62-stats-event-schema]
---

# Mastery radar (skill breakdown)

## Contexto

Skills em language learning multi-dimensional: vocab, grammar, listening, speaking, reading, writing. Atual app cobre subset. Sem visualização de pontos fortes/fracos.

## Problema

- User não sabe "estou bem em vocab mas fraco em listening"
- Sem direcionamento de prática (qual skill priorizar?)
- Achievements / mastery feel monolítico

## Proposta

### Skill dimensions
6 eixos no radar:
1. **Vocabulary** — chunks mastered count / total chunks at user level
2. **Grammar** — grammar structures mastered / total
3. **Reading** — derived de browse + feynman performance
4. **Listening** — dictation accuracy (item 29) average
5. **Speaking** — audio recording score (item 70) average
6. **Active recall** — cloze + feynman quality average

### Calculation
Each axis 0-100:
- Quantitative skills (vocab, grammar): % mastered relative ao corpus disponível no user level (CEFR)
- Qualitative skills (listening, speaking): average quality nas últimas N sessions, normalized

Time decay: skills "rust" se não exercitadas em 30+ dias (drop 10% per week sem activity em that skill).

### Radar chart
SVG-based ou Recharts RadarChart. Two overlays:
- Current (filled, primary color)
- 30 days ago (outline, muted) — show progression

### Recommendations
- Axis fraco → CTA "Practice listening" → link para dictation mode
- Balanced suggestion: prática modes negligenciados

### Per-language radar
- Item 37 (multi-language) → radar per language

### Achievements unlock
- Eixo > 80: badge "Vocabulary Master"
- Todos eixos > 60: badge "All-Rounder"
- Eixo subiu > 20 em 30d: badge "Rapid Improvement"

## Arquivos

- `src/lib/skills/calculator.ts` — compute scores
- `src/components/dashboard/SkillsRadar.tsx`
- `src/components/dashboard/SkillRecommendations.tsx`
- `src/app/api/progress/skills/route.ts`
- Migration: `user_skill_history (user_id, date, vocab, grammar, reading, listening, speaking, recall)` — snapshot weekly

## Validação

- [ ] Score calc consistente (idempotent)
- [ ] Radar responsivo mobile (smaller, simplified)
- [ ] Snapshot weekly preserva histórico
- [ ] Edge case: user novo (todos 0) → mensagem motivacional, sem visual quebrado
- [ ] Time decay: 30d sem activity → skill drops

## Decisões pendentes

- Score formula: linear, log, ou sigmoid? Sigmoid mais smooth.
- Time decay: real ou só visual hint?
- Add 7th eixo "Writing" (Feynman) ou subsume em Active Recall?
- Display vs setting toggle (some users odeiam skill scores gamification)?
