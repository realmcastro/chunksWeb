---
prioridade: 51
categoria: ux,feature
esforco: 1-2 dias
risco: baixo
---

# Onboarding flow para users novos

## Contexto

Após register, user é despejado em dashboard vazio. Sem guidance.

## Problema

- Activation rate baixo: user não sabe por onde começar
- Sem assessment de nível (CEFR) → user pode receber chunks errados
- Sem hook emocional (porquê aprende, goals)

## Proposta

### Multi-step wizard pós-register
1. **Welcome** — motivação ("Why are you learning?" — chips: travel, work, fluency, fun)
2. **Level assessment** — 10 quick questions (chunks com cloze, gradient A1→C2) → infer level
3. **Daily goal** — slider: 10/20/50 chunks per day
4. **Reminder time** — opcional notification setting
5. **First study** — guided tour: "Click here", "Rate yourself"

### Persistence
- `user_onboarding (user_id, step, completed_at, motivation, daily_goal, etc.)`
- Skip option em qualquer step
- Re-acessível em `/settings/onboarding`

### Tour overlay
- Lib: `driver.js` (lightweight) ou custom
- Shows on first `/study` visit
- Dismissible, "Don't show again"

## Arquivos

- `src/app/onboarding/page.tsx` (multi-step)
- `src/components/onboarding/StepWelcome.tsx`
- `src/components/onboarding/StepAssessment.tsx`
- `src/components/onboarding/StepGoal.tsx`
- `src/lib/db/sqlite.ts` — user_onboarding table
- `src/app/api/onboarding/save/route.ts`

## Validação

- [ ] Skip onboarding leva direto a dashboard
- [ ] Complete onboarding seed level + goal
- [ ] Assessment recomenda chunks correctamente
- [ ] Tour aparece 1× e dismissed = não reaparece
- [ ] Mobile-friendly (steps single-column)

## Decisões pendentes

- Assessment length: 10 ou 15 questions? Trade-off accuracy vs friction.
- Mandatory step (block) ou skippable em tudo?
- Re-engagement: usuários antigos que não completaram — re-prompt?
