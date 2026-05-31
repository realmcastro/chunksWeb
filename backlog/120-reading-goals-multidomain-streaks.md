---
prioridade: 120
categoria: feature,library,tracking,ux
esforco: 1 dia
risco: baixo
dependencias: [104-reading-metrics, 84-internal-event-bus, 60-streak-ui-freeze]
---

# Reading goals + streaks multi-domínio

## Contexto

Com métricas de leitura (104) e tracking geral (110-113), falta fechar o loop de motivação: goals de leitura configuráveis e um streak engine que funcione para qualquer módulo, não só estudo de língua.

## Problema

- Streak atual (60) é exclusivo para estudo de língua
- Sem meta de leitura: "quero ler 20 páginas por dia" sem forma de configurar
- Sem streak para "escreveu no diário todo dia" ou "leu todo dia"
- Múltiplos streaks (estudo + leitura + diário) podem conflitar se independentes

## Proposta

### Streak engine genérico

```sql
CREATE TABLE streak_definitions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,                   -- "Leitura diária"
  module TEXT NOT NULL,                 -- 'reading' | 'study' | 'journal' | 'any'
  required_event TEXT NOT NULL,         -- evento do event bus que conta como "dia ativo"
  min_threshold INTEGER DEFAULT 1,      -- min de eventos/unidades no dia para contar
  threshold_unit TEXT DEFAULT 'count',  -- 'count' | 'pages' | 'minutes' | 'words'
  active BOOLEAN DEFAULT TRUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE streak_records (
  id INTEGER PRIMARY KEY,
  streak_id INTEGER NOT NULL REFERENCES streak_definitions(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,      -- 'YYYY-MM-DD'
  total_days_active INTEGER DEFAULT 0
);
```

Subscriber do event bus: ao receber evento → verifica qual streak_definition esse evento satisfaz → incrementa streak.

### Reading goals configuráveis

Settings de leitura:
- **Meta diária**: X páginas / Y minutos de leitura
- **Meta mensal**: Z livros concluídos
- **Meta de velocidade**: N páginas por sessão (informativo)

Progress bar na página `/library`:
- "Hoje: 12/20 páginas · 60% da meta diária"
- "Este mês: 1/2 livros · 50% da meta mensal"

### Streak de leitura

- Definição padrão: `reading.session.ended` com `pages_read ≥ meta_diaria` no dia → conta
- Streak freeze: se user leu ontem mas não hoje → 1 dia de graça (igual à lógica do task 60)

### Dashboard multi-streak

Seção "Consistência" no progress dashboard:
```
🔥 Estudo de idiomas: 23 dias
📖 Leitura:           7 dias
📓 Diário:            14 dias
──────────────────────────
⚡ Qualquer módulo:   42 dias (o maior)
```

### Integração com activity feed

Milestone de streak → evento `app.streak.milestone` → aparece no feed (96):
- "Leitura: 30 dias seguidos de leitura! 📚"
- "Streak geral: 100 dias no sistema! 🏆"

## Arquivos

- Migration: `streak_definitions`, `streak_records`
- `src/lib/streaks/streakEngine.ts` — subscriber + cálculo
- `src/lib/streaks/streakDefinitions.ts` — seed de streaks padrão
- `src/app/api/streaks/route.ts` — GET todos os streaks do user
- `src/components/progress/MultiStreakPanel.tsx`
- `src/components/reading/ReadingGoalProgress.tsx`
- `src/app/settings/goals/page.tsx` — configurar metas por módulo

## Validação

- [ ] Reading session com pages_read ≥ meta → streak de leitura incrementado
- [ ] Dois dias sem leitura → streak zerado (sem freeze)
- [ ] Freeze: 1 dia sem leitura com freeze disponível → streak mantido
- [ ] Multi-streak dashboard: dados de 3 módulos exibidos corretamente
- [ ] Milestone 30 dias → evento no activity feed

## Decisões pendentes

- Streak de "qualquer módulo" (o maior): computado em tempo real ou tabela separada?
- Freeze tokens: quantidade por mês? — herdada da lógica de 60
- Goal configurável por domínio de estudo também (ex: "30 chunks de Python por dia")?
