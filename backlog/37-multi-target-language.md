---
prioridade: 37
categoria: feature
esforco: 3-4 dias
risco: alto
---

# Multi-target language (aprender múltiplos idiomas simultaneamente)

## Contexto

Atual: `user_settings.learning_language` (single string). Switch entre PT/ES/FR perde estado de progresso anterior.

## Problema

- User aprendendo EN→FR não pode pausar e iniciar EN→ES sem reset
- Progress per-chunk não sabe qual language o user estava aprendendo
- Limita polyglot users

## Proposta

### Schema
Migration:
```sql
CREATE TABLE user_learning_languages (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  language_code TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  added_at INTEGER NOT NULL,
  UNIQUE(user_id, language_code)
);

-- user_progress ganha language_code FK
ALTER TABLE user_progress ADD COLUMN language_code TEXT NOT NULL DEFAULT 'en';
```

### UI
- Settings: gerenciar languages (add/remove)
- TopNav: dropdown "Learning: FR" → switch active language
- Active language persisted em session ou separate cookie
- Cada chunk study/review filtra por active language_code

### Migration de dados existentes
- Backfill: assumir todos user_progress são da current learning_language do user
- One-time migration script

### Streak / stats
- Per-language streak? Ou shared cross-language?
  - **Recomendado: shared** (user studied today em qualquer idioma)
  - Métricas per-language também (dashboard tabs)

## Arquivos

- Migration
- `src/lib/db/sqlite.ts` — adapt queries para incluir language_code
- `src/components/layout/TopNav.tsx` — active language switcher
- `src/app/settings/languages/page.tsx`
- `src/lib/contexts/LearningLanguageContext.tsx` — array em vez de single

## Validação

- [ ] User adiciona FR + ES, switcha entre eles
- [ ] Progress de FR não confunde com ES
- [ ] Streak compartilhado funciona
- [ ] Migration: users existentes não perdem progresso
- [ ] Browse filtra apenas chunks da active language

## Decisões pendentes

- Streak: shared ou per-language?
- Allow learning multiple languages com mesmo chunk (raro, mas multilingual cognates)?
- UI: how prominent é language switcher? Defaults to current language only.
