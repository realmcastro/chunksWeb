---
prioridade: 14
categoria: security,compliance
esforco: 1 dia
risco: medio
status: concluido
---

# Account deletion + GDPR data export

## Contexto

Sem rota para deletar conta. Sem export de dados do user. GDPR / LGPD exigem ambos para users EU/BR.

## Problema

- Compliance: regulações exigem direito ao apagamento e portabilidade
- Trust: ausência de delete reduz confiança / retenção lifetime
- Risk: dados de users inativos acumulam sem expiry

## Proposta

### Delete account
- `DELETE /api/auth/delete-account { password }` — soft-delete (set `users.deleted_at`) por 30 dias antes de hard-delete
- Cascade: `user_progress`, `study_sessions`, `chunk_reports`, `user_voice_settings`, `feynman_explanations` — soft-delete ou anonymize
- Logout imediato (clear session cookie)
- Audit log: gravar evento `account_deletion_requested` em tabela `user_audit_log`

### Data export
- `GET /api/user/export-data` — gera JSON com todo dado do user (chunks favoritados, progress, sessions, settings, recordings se existirem)
- Async para datasets grandes? Por enquanto sync (dataset típico < 1MB)
- Format: JSON bundled; futuramente CSV opcional

### Background hard-delete
- Script `scripts/cleanup-deleted-users.ts` — corre via cron, remove rows `deleted_at < now - 30d`

## Arquivos

- `src/app/api/auth/delete-account/route.ts`
- `src/app/api/user/export-data/route.ts`
- `src/lib/db/sqlite.ts` — `softDeleteUser()`, `hardDeleteUser()`, `exportUserData()`
- `src/app/settings/account/page.tsx` — adicionar seção "Delete account" e "Download my data"
- `scripts/cleanup-deleted-users.ts`
- Migration: `users.deleted_at`, `user_audit_log` table

## Validação

- [ ] Delete requer password reentry (anti-CSRF intent)
- [ ] Soft-deleted user não consegue mais login
- [ ] 30 dias grace: rota `/api/auth/restore-account` (login + restore) — opcional
- [ ] Export retorna JSON válido com schema documentado
- [ ] Cascade preserva integridade referencial

## Decisões pendentes

- Grace period: 30d sufficient? GDPR não exige específico.
- Anonymize vs hard-delete chunks reportados pelo user (precisam ficar para moderation history)?
- Export format: JSON only ou CSV adicional?
