---
prioridade: 104
categoria: feature,library,ux
esforco: 1 dia
risco: baixo
dependencias: [103-reading-position-sync, 62-stats-event-schema]
---

# Reading metrics — tempo, páginas, sessões

## Contexto

Com position sync funcionando (103), é possível calcular métricas reais de leitura: quantas páginas por dia, quanto tempo lendo, ritmo por livro.

## Problema

- Usuário não tem visibilidade de seu hábito de leitura
- Sem dados de tempo — só posição (page N), não "quanto tempo fiquei nessa página"
- Sem integração com o sistema de tracking geral (item 110)

## Proposta

### Schema adicional
```sql
CREATE TABLE reading_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  book_id INTEGER NOT NULL REFERENCES books(id),
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  pages_read INTEGER,
  words_estimated INTEGER   -- pages_read × avg_words_per_page do livro
);
```

### Coleta
- Reader cria sessão ao abrir (`POST /api/books/[id]/sessions/start`)
- Reader finaliza ao sair/idle > 5min (Visibility API + idle detection de 111)
- Calcular `pages_read` = página final − página inicial da sessão

### Métricas exibidas
1. **Cards de livro** na biblioteca: "12h lidas · 3 sessões · 47 pág/dia médio"
2. **Detalhe do livro**: gráfico de páginas lidas por dia (últimos 30 dias)
3. **Dashboard geral**: leitura aparece no tracking global (110) como `section: 'reading'`
4. **Velocidade estimada**: "~14 dias para concluir no ritmo atual"

## Arquivos

- Migration: `reading_sessions`
- `src/app/api/books/[id]/sessions/route.ts` — start/end session
- `src/lib/db/sqlite.ts` — getReadingStats, getReadingSessionsByBook
- `src/components/reading/ReadingStatsCard.tsx`
- `src/components/reading/PagesPerDayChart.tsx`

## Validação

- [ ] Sessão criada ao abrir reader, finalizada ao fechar
- [ ] Sessão finalizada por idle (> 5min sem mudança de página)
- [ ] Páginas lidas calculadas corretamente (diferença de página, não duração)
- [ ] Estimativa de conclusão usa média das últimas 7 sessões

## Decisões pendentes

- Mostrar métricas de leitura no progress dashboard geral (61) ou apenas em `/library`?
- `words_estimated`: usar valor fixo (250 words/page) ou configurável por livro?
