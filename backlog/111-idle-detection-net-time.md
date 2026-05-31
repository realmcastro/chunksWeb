---
prioridade: 111
categoria: feature,tracking,ux
esforco: 1 dia
risco: médio
dependencias: [110-activity-tracking-infra]
---

# Idle detection + net time calculation — tempo líquido por sessão

## Contexto

Task 110 define o schema e API. Esta task implementa o motor client-side: detecção de inatividade, cálculo de tempo líquido real, e gestão do ciclo heartbeat/idle.

## Problema

- Aba aberta ≠ usuário presente
- Sem detecção de idle → net_active_ms = gross duration (enganoso)
- Thresholds de idle variam por contexto (leitura permite pausas maiores que review)

## Proposta

### Hook `useIdleDetector`
```typescript
// Emite eventos: 'active' | 'idle'
// Threshold configurável por seção
useIdleDetector({ idleAfterMs: 60_000, onIdle, onActive })
```

Eventos monitorados:
- `mousemove`, `mousedown`, `keydown`, `scroll`, `touchstart`, `wheel`
- Page Visibility API: `visibilitychange` → hidden = idle imediato

### Hook `useActivitySession(section, contextId?)`
- Ao montar: `POST /api/tracking/sessions` → armazena `sessionId`
- Inicia timer de heartbeat (30s)
- Listener de idle: ao ficar idle, pausa acumulação de `activeMs`
- Ao voltar: retoma acumulação
- Heartbeat payload: `{ active_ms_delta: number }` (apenas tempo ativo desde último beat)
- `beforeunload`: tenta enviar último heartbeat (beacon API — garante envio mesmo ao fechar tab)

### Beacon no unload
```typescript
navigator.sendBeacon('/api/tracking/sessions/' + id + '/end', JSON.stringify({ active_ms_delta }))
```

### Thresholds padrão por seção
| Seção | Idle threshold |
|-------|---------------|
| language_study | 60s |
| review | 45s |
| reading | 120s |
| journal | 180s |
| other | 60s |

## Arquivos

- `src/lib/hooks/useIdleDetector.ts`
- `src/lib/hooks/useActivitySession.ts`
- `src/lib/tracking/idleThresholds.ts` — constantes por seção

## Validação

- [ ] Parar mexer por 61s em study → idle detectado, net_active para
- [ ] Mover mouse → volta a contar imediatamente
- [ ] Fechar tab: beacon enviado, sessão encerrada com net_active correto
- [ ] Trocar de aba (visibility hidden) → idle imediato
- [ ] Reading com 120s threshold: pausa de leitura não corta sessão prematuramente

## Decisões pendentes

- Beacon fallback se navegador não suportar sendBeacon? (XHR sync — deprecated, ou aceitar perda)
- Service Worker interceptar beacon para garantia offline?
