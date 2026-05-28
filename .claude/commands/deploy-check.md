Pre-deployment validation checklist for the current state of the codebase.

## Automated Checks

Run these commands and report results:

1. **TypeScript** — `npx tsc --noEmit` (type errors)
2. **ESLint** — `npm run lint` (lint errors)
3. **Build** — `npm run build` (build success)

## Manual Inspection

### Critical Files
- [ ] `next.config.js` — no dev-only settings leaked to production
- [ ] `src/lib/auth/session.ts` — cookie security flags appropriate for production
- [ ] No `console.log` statements in production code (except structured logging)
- [ ] No hardcoded localhost URLs
- [ ] No test/debug data in committed database

### Environment
- [ ] Required env vars documented
- [ ] No secrets in source code
- [ ] PWA manifest correct (`public/manifest.json`)
- [ ] Image domains configured in `next.config.js`

### Database
- [ ] SQLite file permissions appropriate
- [ ] No pending schema changes
- [ ] WAL mode considerations for production

### Performance
- [ ] No `unoptimized: true` for images in production (currently enabled — flag this)
- [ ] Bundle size acceptable
- [ ] No blocking resources in critical path

## Output

| Check | Status | Details |
|-------|--------|---------|

End with: READY TO DEPLOY / BLOCKED (list blockers) / NEEDS REVIEW (list concerns).
