# Agent Registry — Auto-Routing

## Routing Table

| Task Pattern | Agent | Rules Enforced |
|-------------|-------|----------------|
| Architecture plan, module structure, feature design, dependency analysis, new feature scaffolding | **frontend-architect** | architecture, components, hooks, state, rendering, server-client-boundary, accessibility |
| Code review, PR review, diff review, quality check | **ALL agents** (each reviews own domain) | code-review + all domain rules |
| Security audit, auth changes, input validation, secret management, vulnerability check | **security-auditor** | security, server-client-boundary (secrets), api (auth) |
| Performance analysis, render optimization, bundle size, query efficiency, lazy loading | **performance-analyst** | rendering, components (perf), api (queries) |
| Test strategy, test writing, coverage analysis, test quality review | **testing-strategist** | testing |
| API route creation, route modification, endpoint design, contract validation | **api-integration** | api, architecture (API aspects) |
| Error handling, logging, monitoring, error boundaries, debugging | **observability** | observability, code-review (error handling) |

## Keyword Matching

### frontend-architect
`architecture`, `structure`, `component`, `feature`, `refactor`, `boundary`, `server component`, `client component`, `state management`, `hook design`, `layout`, `composition`, `accessibility`, `a11y`, `design system`

### security-auditor
`security`, `auth`, `authentication`, `session`, `cookie`, `XSS`, `injection`, `CSRF`, `secret`, `vulnerability`, `OWASP`, `sanitize`, `validate input`, `password`

### performance-analyst
`performance`, `slow`, `render`, `re-render`, `bundle`, `lazy`, `memoize`, `optimize`, `N+1`, `query performance`, `hydration`, `streaming`, `cache`

### api-integration
`API`, `route`, `endpoint`, `handler`, `request`, `response`, `REST`, `contract`, `DTO`, `validation schema`

### testing-strategist
`test`, `coverage`, `vitest`, `playwright`, `unit test`, `integration test`, `E2E`, `spec`, `assertion`

### observability
`log`, `logging`, `error handling`, `error boundary`, `monitoring`, `tracing`, `debug`, `observability`

## Conflict Resolution

1. **Security always wins** — if task touches security + another domain, security-auditor has veto
2. **Multi-domain tasks** — primary agent leads, others consulted:
   - "Create secure API endpoint" → api-integration leads, security-auditor validates
   - "Optimize component rendering" → performance-analyst leads, frontend-architect validates structure
   - "Add error logging to API" → observability leads, api-integration validates route pattern
3. **Ambiguous tasks** — default to frontend-architect (broadest scope)
4. **Code review** — all agents participate, each flagging violations in their domain

## Auto-Routing Behavior

When Matheus describes a task:
1. Match task description against keyword table
2. Select highest-confidence agent automatically
3. Apply that agent's enforced rules throughout execution
4. Only mention agent selection if genuinely ambiguous (2+ agents match equally)
5. If task spans multiple domains, declare primary + supporting agents upfront
