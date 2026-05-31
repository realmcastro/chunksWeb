---
prioridade: 110
categoria: module,tracking,observability,data
esforco: 2 dias
risco: médio
dependencias: [62-stats-event-schema, 19-migration-runner]
---

# Activity tracking infrastructure — schema de eventos por seção

## Contexto

Usuário quer saber quanto tempo passa em cada seção do sistema (estudo de línguas, leitura, diário, agenda). Esta task cria a infra: schema de eventos de sessão por seção, API de registro, e modelo bruto/líquido.

## Problema

- `study_sessions` existe mas é restrito a estudo de línguas
- Sem tracking para leitura, diário, ou outras seções futuras
- Sem conceito de "tempo líquido" (ativo) vs "tempo bruto" (aba aberta)
- Item 65 (time investment) cobre estudo de línguas — esta task generaliza para todo o sistema

## Proposta

### Modelo bruto vs líquido
- **Bruto**: `session_start` até `session_end` — inclui inatividade
- **Líquido**: soma dos intervalos com atividade detectada dentro da sessão
- Atividade: qualquer evento DOM (mousemove, keydown, click, scroll, touchstart)
- Idle threshold: se nenhum evento em X segundos → parar contagem líquida
- X configurável por seção (estudo: 60s; leitura: 120s; diário: 180s — usuário pode estar pensando)

### Schema
```sql
CREATE TABLE app_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  section TEXT NOT NULL CHECK(section IN (
    'language_study', 'review', 'reading', 'journal', 'agenda',
    'library', 'progress', 'settings', 'other'
  )),
  context_id TEXT,                 -- ex: book_id, chunk_id — nullable
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  gross_duration_ms INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL THEN ended_at - started_at ELSE NULL END
  ) STORED,
  net_active_ms INTEGER DEFAULT 0,  -- acumulado por heartbeats client-side
  device_type TEXT CHECK(device_type IN ('desktop','mobile','tablet'))
);

CREATE INDEX idx_app_sessions_user_section ON app_sessions(user_id, section, started_at);
```

### Heartbeat API
- Client envia `PATCH /api/tracking/sessions/[id]/heartbeat` a cada 30s com `active_ms_since_last`
- Server acumula `net_active_ms`
- Session encerra automaticamente se sem heartbeat > 5min (background job ou detectado no próximo open)

### Session lifecycle
1. User entra na seção → `POST /api/tracking/sessions` → retorna `sessionId`
2. Client armazena `sessionId` em memória (não localStorage — não persiste entre tabs)
3. A cada 30s: heartbeat com delta de ms ativos
4. `beforeunload` ou Page Visibility API "hidden" → `PATCH .../end`

## Arquivos

- Migration: `app_sessions`
- `src/app/api/tracking/sessions/route.ts` — POST start
- `src/app/api/tracking/sessions/[id]/route.ts` — PATCH heartbeat, PATCH end
- `src/lib/hooks/useActivitySession.ts` — hook cliente: start, heartbeat, end
- `src/lib/hooks/useIdleDetector.ts` — detecta inatividade, para contagem líquida
- `src/lib/db/sqlite.ts` — createAppSession, updateHeartbeat, endSession, getSessionStats

## Validação

- [ ] Session criada ao entrar em seção rastreada
- [ ] Heartbeat acumula net_active_ms corretamente
- [ ] Idle > threshold → net_active_ms para de crescer
- [ ] `beforeunload` encerra sessão
- [ ] Múltiplas tabs não duplicam sessões (flag "already tracking" por tab)

## Decisões pendentes

- Idle threshold por seção hardcoded ou configurável por user?
- Rastrear por seção ou por página exata? — por seção é menos intrusivo
- Opt-out de tracking? — GDPR/LGPD considerar (task 36)
