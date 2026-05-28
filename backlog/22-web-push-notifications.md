---
prioridade: 22
categoria: feature,pwa
esforco: 2-3 dias
risco: medio
---

# Web Push notifications (review reminders, streak save)

## Contexto

PWA instalável. Service worker `public/sw.js` faz cache (workbox). **Zero push notifications.**

## Problema

- User não tem reminder para review due → streak quebra
- Reengagement zero após user fechar tab
- Notificações nativas (push API) zero custo após setup, alto valor retention

## Proposta

### Subscription
- Gerar VAPID keypair (one-time): `npx web-push generate-vapid-keys`
- Public key em `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Client: `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`
- POST subscription para `/api/user/push-subscription`
- Tabela `user_push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at, last_used_at)`

### Sending
- Use case 1: review reminder — cron diário verifica users com chunks due, envia push
- Use case 2: streak save — 22h local time, if streak ativo + sem activity today, push "Don't lose your streak!"
- Lib: `web-push` npm package
- Server function `sendPushTo(userId, payload)`:
  ```ts
  const subs = getPushSubscriptions(userId);
  for (const sub of subs) {
    await webpush.sendNotification(sub, JSON.stringify(payload));
  }
  ```

### Service worker
- `self.addEventListener('push', e => { e.waitUntil(self.registration.showNotification(...)); })`
- `notificationclick` → open `/study` page

### Settings UI
- Toggle: "Enable review reminders"
- Time picker: "Remind me at" (HH:mm local)
- Test button: "Send test notification"

### Cron
- Local dev: node-cron in-process (dev only)
- Prod: external cron call → `/api/internal/push-reminders` (auth via shared secret)

## Arquivos

- `package.json` — add `web-push`
- `src/lib/push/` — subscription + sender
- `src/app/api/user/push-subscription/route.ts`
- `src/app/api/internal/push-reminders/route.ts`
- `public/sw.js` — push + notificationclick handlers
- `src/components/PushPermissionBanner.tsx`
- `src/app/settings/notifications/page.tsx`
- Migration: `user_push_subscriptions`

## Validação

- [ ] Permission denied → graceful degrade (sem banner repetitivo)
- [ ] Subscription persiste em DB
- [ ] Test notification chega em < 5s
- [ ] notificationclick abre app
- [ ] Sub expirada (410) → remover do DB
- [ ] iOS Safari 16.4+ compat (instalado PWA only)

## Decisões pendentes

- Cron infra: external (Vercel cron, GitHub Actions schedule, EasyCron)?
- VAPID key rotation policy?
- Localização do push body (i18n)?
- Notificação de novos features / announcements — separado de reminders?
