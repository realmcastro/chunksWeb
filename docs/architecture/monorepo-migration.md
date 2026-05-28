# Monorepo Migration Roadmap

## Current State

Single Next.js application at project root. All code in `src/`. No Turborepo, no workspace configuration.

## Target Architecture

```
chunks-platform/
├── apps/
│   ├── web/                    # Current ChunksWeb application
│   └── admin/                  # Future: admin dashboard
├── packages/
│   ├── ui/                     # Shared design system components
│   ├── config-eslint/          # Shared ESLint configuration
│   ├── config-typescript/      # Shared TypeScript configuration
│   ├── config-tailwind/        # Shared Tailwind configuration
│   ├── database/               # Database layer (sqlite.ts extraction)
│   ├── auth/                   # Authentication module
│   ├── spaced-repetition/      # SM-2 algorithm (reusable)
│   ├── i18n/                   # Internationalization
│   └── shared-types/           # Shared TypeScript interfaces
├── tooling/
│   ├── scripts/                # Build/migration scripts
│   └── testing/                # Shared test configuration
├── docs/
│   └── architecture/           # Architecture documentation
├── turbo.json                  # Turborepo pipeline configuration
├── package.json                # Root workspace configuration
└── CLAUDE.md                   # Root project instructions
```

## Migration Phases

### Phase 0: Prerequisites (before migration)

- [ ] Add test suite (Vitest) to current app
- [ ] Add Husky + lint-staged for commit hooks
- [ ] Add Prettier configuration
- [ ] Ensure `npm run build` passes cleanly
- [ ] Ensure `npm run lint` passes cleanly
- [ ] Document all environment variables
- [ ] Create .env.example

### Phase 1: Initialize Monorepo Shell

- [ ] Install Turborepo: `npx create-turbo@latest`
- [ ] Create workspace root `package.json` with npm workspaces
- [ ] Create `turbo.json` with pipeline (build, lint, test, dev)
- [ ] Move current app to `apps/web/`
- [ ] Verify app still builds and runs from new location
- [ ] Update all relative paths (database, assets)

### Phase 2: Extract Shared Configurations

- [ ] Create `packages/config-typescript/` with base tsconfig
- [ ] Create `packages/config-eslint/` with shared rules
- [ ] Create `packages/config-tailwind/` with shared config
- [ ] Update `apps/web` to extend shared configs

### Phase 3: Extract Reusable Packages

Priority order (least coupling first):

1. **shared-types** — Extract `src/types/index.ts` + interface definitions from sqlite.ts
2. **spaced-repetition** — Extract SM-2 algorithm (pure function, zero dependencies)
3. **i18n** — Extract i18n provider + translation infrastructure
4. **auth** — Extract session management
5. **database** — Extract sqlite.ts (most coupled, do last)
6. **ui** — Extract base UI components (Button, Card, Input)

### Phase 4: CI/CD

- [ ] Configure Turborepo remote caching
- [ ] Set up GitHub Actions with Turborepo-aware build
- [ ] Per-package test pipelines
- [ ] Per-app deployment pipelines

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Path breakage during move | Build fails | Test thoroughly after each phase |
| Database path resolution | App can't find SQLite file | Use environment variable for DB path |
| Import path changes | Many files need updating | Use find-and-replace, verify with build |
| PWA manifest paths | Service worker breaks | Update manifest + next-pwa config |
| Dev experience disruption | Developer productivity drops | Keep dev server working at each phase |

## When to Migrate

Trigger conditions (any 2 of):
- Second app/service needed (admin dashboard, mobile API)
- Second developer joins the project
- Need to reuse SM-2 or i18n in another project
- CI/CD pipeline needed for automated deployment

**Do NOT migrate prematurely.** A monorepo for a single app adds complexity without benefit. The current single-app structure is correct for the current scale.

## White-Label Preparation

When multi-tenant is needed, add:

```
packages/
├── brands/
│   ├── default/
│   │   ├── theme.ts          # CSS variables
│   │   ├── assets/           # Logos, favicons
│   │   └── config.ts         # Feature flags, endpoints
│   ├── client-a/
│   └── client-b/
```

Brand resolution at build time or runtime via environment variable. Never hardcode tenant logic in components — parameterize everything.
