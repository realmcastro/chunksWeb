---
prioridade: 75
categoria: feature
esforco: 3-4 dias
risco: alto
status: bloqueado-decisao
---

# Admin / instructor dashboard

## Contexto

Schema atual: `users` sem role. Todo código assume `userId=1` quando unauthenticated. Não há separação learner / admin / instructor.

## Problema

- Impossível ter visão agregada de progresso (analytics multi-user)
- Sem CRUD de chunks via UI (apenas via DB direta)
- Sem moderation de chunk reports

## Proposta

1. Schema: `users.role` enum (`learner` | `admin`)
   - Migration: existing users default `learner`, seed um admin manual
2. Middleware: `requireRole('admin')` em rotas `/admin/*`
3. Pages:
   - `/admin/users` — lista + stats por user
   - `/admin/chunks` — CRUD chunks
   - `/admin/reports` — chunk reports moderation
   - `/admin/analytics` — agregado (sessions/day, retention, top categories)
4. Permissions audit em CLAUDE.md security rules

## Arquivos

- Migration SQL
- `src/lib/auth/session.ts` (include role)
- `src/lib/auth/permissions.ts` (novo)
- `src/middleware.ts` (gate `/admin/*`)
- `src/app/admin/**/page.tsx` (várias)
- `src/app/api/admin/**/route.ts` (várias)

## Validação

- [ ] Non-admin recebe 403 em `/admin/*` (server-side, não apenas hide UI)
- [ ] Admin acessa todos os dados
- [ ] Bootstrap: seed admin via env var / first-user-is-admin policy

## Decisões pendentes

- **Definir model**: role enum único ou permissions granulares?
- Bootstrap: primeiro user = admin? Env `BOOTSTRAP_ADMIN_USERNAME`?
- Instructor tier separado de admin? (admin: tudo; instructor: vê só own students)
- Audit log de ações admin? Tabela `admin_audit_log` recomendada.
