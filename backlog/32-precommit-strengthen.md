---
prioridade: 32
categoria: dx
esforco: 1h
risco: baixo
---

# Pre-commit hook strengthen (add tsc + audit)

## Contexto

`.husky/pre-commit` roda apenas `lint-staged` (eslint --fix em ts/tsx).
`.husky/pre-push` roda `npm test`.

## Problema

- Tipo errado commitado, CI quebra (loop dev local → push → CI fail → fix → push)
- `any` ou `@ts-ignore` introduzido sem alert imediato
- CVE high commitada sem alerta

## Proposta

### Pre-commit
```sh
npx lint-staged
npx tsc --noEmit
```
- `tsc --noEmit` sobre arquivos staged: rápido (incremental cache)
- Alt: usar `tsc-files` para checar apenas arquivos staged

### Pre-push
Já roda `npm test`. Adicionar:
```sh
npm test
npm audit --audit-level=high --production
```

### CI
- Já tem typecheck. Manter como safety net.
- Adicionar `npm audit` em workflow.

## Arquivos

- `.husky/pre-commit`
- `.husky/pre-push`
- `package.json` (optional dev dep `tsc-files`)

## Validação

- [ ] Commit com type error: bloqueado
- [ ] Commit com lint error: auto-fix ou bloqueado
- [ ] Push com test falhando: bloqueado
- [ ] Push com new CVE high: warn + bloqueado

## Decisões pendentes

- tsc full vs incremental? Full ~30s, incremental ~3s mas requer state file.
- `npm audit` em pre-push é lento (~10s) — aceitar trade-off?
- Permitir bypass via `--no-verify`? Documentar quando aceitável.
