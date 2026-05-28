---
prioridade: 21
categoria: pwa,feature
esforco: 1-2 dias
risco: medio
---

# Offline sync queue completion

## Contexto

`src/lib/offline/db.ts` define Dexie + `mutationQueue`. `src/lib/offline/queue.ts` implementação parcial. **Não wired ao app** — sync nunca dispara em reconnect.

## Problema

- User offline submete review → mutation perdida (não enfileirada ou enfileirada mas nunca replay)
- Sem feedback visual de pending sync
- Conflitos não resolvidos (mesmo chunk reviewed offline e online)

## Proposta

### Enqueue
- Interceptar mutating fetches via custom hook `useApiMutation`:
  ```ts
  if (!navigator.onLine) {
    await mutationQueue.add({ url, method, body, createdAt });
    return { queued: true };
  }
  ```

### Replay
- Event listener em `window.online`:
  ```ts
  window.addEventListener('online', () => syncQueue());
  ```
- `syncQueue()`: drena queue FIFO, replay via fetch normal, remove on 2xx

### UI feedback
- `OfflineIndicator.tsx` (existe) → mostrar count de pending mutations
- Toast on sync complete: "3 reviews synced"

### Conflict resolution
- Server-side: last-write-wins inicialmente (SM-2 quality submission idempotente?)
- Documentar limitação: review duplicado em offline+online = último ganha

### Background Sync API
- Optional: registrar background sync tag em SW para replay quando user fechar tab offline (compat: Chrome only)

## Arquivos

- `src/lib/offline/queue.ts` — completar drain logic
- `src/lib/hooks/useApiMutation.ts` (NEW) — wrapper enqueue-aware
- `src/components/providers/AuthProvider.tsx` ou similar — wire `window.online` listener
- `src/components/OfflineIndicator.tsx` — pending count display
- `public/sw.js` — optional background sync tag

## Validação

- [ ] DevTools offline → submit review → enqueued (Dexie inspector)
- [ ] Network restore → queue drena → UI atualiza
- [ ] Toast aparece após sync
- [ ] Crash recovery: tab fechada mid-sync, próxima sessão completa
- [ ] Duplicate prevention: mesma mutation não envia 2×

## Decisões pendentes

- Retry policy: exponential backoff? Max attempts?
- Quais routes enfileirar? Review/submit, favorites, feynman/submit. Não enfileirar reads.
- Auth token expirou durante offline — handle 401 na replay?
