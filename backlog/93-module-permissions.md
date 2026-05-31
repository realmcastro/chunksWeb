---
prioridade: 93
categoria: security,auth,architecture
esforco: 1.5 dias
risco: médio
dependencias: [83-domain-model-pluggable-topics, 47-2fa-totp]
---

# Module permissions — controle de acesso por módulo

## Contexto

Meta-épico 09. Sistema pessoal hoje, mas roadmap inclui: admin dashboard (75), automações, agentes AI, sharing parcial do knowledge graph. Sem permission model: retrabalo total quando chegar lá.

## Problema

- Auth atual: cookie session → userId. Binário (autenticado ou não).
- Sem granularidade: um user autenticado acessa tudo
- Admin (75) precisará de role diferenciada
- Compartilhar entry de journal ou livro futuramente exige permissão por recurso
- Agentes AI (80) precisarão de scopes limitados (só leitura, só certos módulos)

## Proposta

### RBAC leve (não ABAC — não exagerar)

```sql
CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE    -- 'owner' | 'admin' | 'viewer' | 'agent'
);

CREATE TABLE user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  granted_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, role_id)
);

-- Permissão por módulo (granular)
CREATE TABLE module_permissions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  module TEXT NOT NULL CHECK(module IN ('study','reading','journal','tracking','admin','search')),
  can_read BOOLEAN DEFAULT TRUE,
  can_write BOOLEAN DEFAULT TRUE,
  can_delete BOOLEAN DEFAULT FALSE,
  granted_by INTEGER REFERENCES users(id),
  granted_at INTEGER NOT NULL
);
```

### Roles padrão

| Role | Capacidade |
|------|-----------|
| `owner` | tudo (o próprio user) |
| `admin` | leitura de todos os módulos de todos os users |
| `agent` | scopes limitados declarados no token |
| `viewer` | leitura de recursos explicitamente compartilhados |

### Middleware de verificação

```typescript
// src/lib/auth/permissions.ts
async function requireModulePermission(
  userId: number,
  module: Module,
  action: 'read' | 'write' | 'delete'
): Promise<void>   // throws 403 se não permitido
```

Aplicado nos route handlers antes da lógica de negócio.

### Agent scopes (AI, task 80)

- Token de agente carrega `scopes: ['study:read', 'journal:read']`
- Middleware verifica scope antes de executar
- Agente nunca acessa módulos fora do seu scope, mesmo que userId seja válido

### Compartilhamento futuro (viewer role)

- `POST /api/sharing/[module]/[resourceId]` → cria invite link
- Visitante com link → role `viewer` para aquele recurso específico
- Não bloqueia essa task, mas schema suporta

## Arquivos

- Migration: `roles`, `user_roles`, `module_permissions`
- `src/lib/auth/permissions.ts` — requireModulePermission
- `src/lib/auth/roles.ts` — role constants e checks
- `src/lib/seed/roles.ts` — seed padrão (owner, admin, agent, viewer)
- Atualizar route handlers críticos para usar middleware

## Validação

- [ ] User sem permissão explícita no módulo → 403 com mensagem não-reveladora
- [ ] Owner sempre tem acesso total a seus próprios dados
- [ ] Agent com scope `study:read` não acessa `/api/journal`
- [ ] Migration não quebra users existentes (todos ganham role `owner` para seus próprios dados)

## Decisões pendentes

- Granularidade de permissão: por módulo (proposta) ou por recurso individual?
  - Por módulo agora, por recurso quando sharing for implementado
- Token de agente: JWT separado do cookie de sessão? — sim (scoped token diferente)
