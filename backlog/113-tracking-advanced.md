---
prioridade: 113
categoria: feature,tracking,observability
esforco: 2 dias
risco: médio
dependencias: [112-usage-analytics-dashboard, 84-internal-event-bus]
---

# Tracking avançado — event queue, dedup, funil, session replay leve

## Contexto

Tasks 110–112 constroem tracking básico. Esta task adiciona as camadas de confiabilidade e análise: queue para garantia de entrega, deduplicação rigorosa, funil comportamental, e session replay minimalista (apenas eventos, sem vídeo).

## Problema

- Heartbeat pode ser perdido (tab fechada bruscamente, falha de rede)
- Double counting: refresh rápido pode criar 2 sessões para o mesmo intervalo
- Sem análise de funil: "user inicia estudo → abandona antes de completar sessão"
- Sem forma de debugar "o que o user fez antes de encontrar este bug?"

## Proposta

### Event queue com garantia de entrega

```typescript
// Client-side queue (Dexie IndexedDB)
interface QueuedEvent {
  id: string;          // uuid client-side
  type: string;
  payload: unknown;
  created_at: number;
  sent_at?: number;
  retries: number;
}
```

- Eventos primeiro escritos localmente, depois enviados
- Retry automático: exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Purga: eventos > 24h sem envio → descartados + log
- `POST /api/events/batch` — envio de múltiplos eventos em uma request

### Deduplicação rigorosa

```sql
-- Na tabela domain_events (task 84)
-- Adicionar:
ALTER TABLE domain_events ADD COLUMN client_event_id TEXT UNIQUE;
```

- `client_event_id` gerado no client (UUID)
- Server: `INSERT OR IGNORE` — idempotente
- Janela de dedup: se mesmo `client_event_id` chegar 2x → segunda ignorada silenciosamente

### Anti double-counting de sessão

- Session start gera `session_token` (UUID)
- Heartbeat inclui `session_token`
- Server verifica: `session_token` existente → update, não create
- Refresh da página: detecta `session_token` em sessionStorage → reconecta sessão existente (não cria nova)

### Funil comportamental

```sql
CREATE TABLE behavior_funnels (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  funnel_name TEXT NOT NULL,   -- 'study_completion' | 'reading_start' | 'journal_write'
  step TEXT NOT NULL,          -- 'opened' | 'started' | 'completed' | 'abandoned'
  session_id INTEGER REFERENCES app_sessions(id),
  occurred_at INTEGER NOT NULL
);
```

Funis definidos:
- **Study completion**: `session.started → chunk.reviewed(≥1) → session.completed`
- **Reading engagement**: `book.opened → page.changed(≥3) → session.ended`
- **Journal habit**: `journal.opened → entry.saved → goals.set`

Dashboard mostra: "78% das sessões de estudo iniciadas são concluídas".

### Session replay leve (apenas eventos, sem vídeo)

```sql
CREATE TABLE session_events (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES app_sessions(id),
  event_type TEXT NOT NULL,    -- 'navigate' | 'click' | 'focus' | 'blur' | 'error'
  target TEXT,                 -- componente/rota (não seletor DOM — privado)
  metadata TEXT DEFAULT '{}',  -- JSON mínimo
  occurred_at INTEGER NOT NULL
);
```

**Privacidade**: nunca capturar conteúdo de campos de texto, apenas tipo de ação e rota.

Uso: ao reportar bug, user clica "incluir contexto" → exporta últimos N eventos da sessão como JSON para debug.

### Métrica de produtividade líquida

Fórmula: `productivity_score = (net_active_ms / gross_duration_ms) × completion_rate`

- Exibido no dashboard como "Índice de foco: 73%"
- Média dos últimos 7 dias
- Tendência: ↑ melhorando / ↓ piorando

## Arquivos

- `src/lib/tracking/eventQueue.ts` — queue IndexedDB + retry
- `src/lib/tracking/sessionRecovery.ts` — reconecta sessão após refresh
- `src/app/api/events/batch/route.ts` — batch ingest
- Migration: `behavior_funnels`, `session_events`, `client_event_id` em `domain_events`
- `src/lib/tracking/funnelAnalyzer.ts` — cálculo de conversão por funil
- `src/components/tracking/FunnelChart.tsx`
- `src/components/tracking/ProductivityScore.tsx`

## Validação

- [ ] Fechar tab abruptamente: evento na queue → enviado na próxima abertura
- [ ] Mesmo evento enviado 2x: segundo ignorado silenciosamente
- [ ] Refresh durante sessão: sessionStorage token → reconecta, não cria sessão duplicada
- [ ] Funil study_completion: taxa calculada corretamente
- [ ] Session replay: campos de texto não capturados (assertar via teste)

## Decisões pendentes

- Session replay: opt-in explícito do user ou padrão ativo?
  - **Recomendado: opt-in** — privacidade como padrão
- Retenção de `session_events`: 30 dias? 7 dias?
- Batch ingest: max eventos por request? — 100
