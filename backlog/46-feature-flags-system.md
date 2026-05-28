---
prioridade: 46
categoria: dx,feature
esforco: 1-2 dias
risco: baixo
---

# Feature flags system

## Contexto

Sem framework para gradual rollouts. Novas features (FSRS, AI chat, etc.) shipped on/off para todos.

## Problema

- Risk: bug afeta 100% users
- Sem A/B testing para validar mudanças (ex: SM-2 vs FSRS efetividade)
- Sem kill switch para incidents

## Proposta

### Storage
```sql
CREATE TABLE feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0,
  metadata TEXT,  -- JSON for variants, conditions
  updated_at INTEGER NOT NULL
);

CREATE TABLE user_feature_overrides (
  user_id INTEGER,
  flag_key TEXT,
  enabled BOOLEAN,
  PRIMARY KEY (user_id, flag_key)
);
```

### API
- `src/lib/feature-flags.ts`:
  ```ts
  export function isFeatureEnabled(key: string, userId?: number): boolean {
    const override = getUserOverride(userId, key);
    if (override !== undefined) return override;
    const flag = getFlag(key);
    if (!flag?.enabled) return false;
    if (flag.rollout_percentage === 100) return true;
    return hashUserId(userId, key) % 100 < flag.rollout_percentage;
  }
  ```
- Hash determinístico → user sempre na mesma cohort

### Admin UI
- `/admin/feature-flags` — toggle, rollout %, force on/off por user
- Audit log de mudanças

### Usage
```tsx
{isFeatureEnabled('fsrs_algorithm', userId) && <FSRSStudyMode />}
```

### Caching
- Cache em memória 5min para reduzir DB hits
- Invalidate on update

## Arquivos

- Migrations
- `src/lib/feature-flags.ts`
- `src/app/api/admin/feature-flags/route.ts`
- `src/app/admin/feature-flags/page.tsx`

## Validação

- [ ] Flag off: feature hidden
- [ ] Rollout 50%: ~half users veem
- [ ] User override: força on/off ignorando rollout
- [ ] Hash consistency: mesmo user sempre mesma cohort
- [ ] Cache invalida após update

## Decisões pendentes

- DIY vs serviço (LaunchDarkly, GrowthBook OSS, Unleash)?
- A/B test analytics integration (event tracking → conversion metric)?
- Feature flag scope: user-level, session-level, request-level?
