# ChunksWeb Site Revision Plan

## Current Issues Identified

### Critical Issues

1. **Dashboard uses `--danger` but CSS defines `--destructive`** - streak stat card breaks
2. **Settings page says "Built with Prisma"** - outdated, no longer using Prisma
3. **Theme toggle in settings doesn't function** - static buttons, no state management
4. **Old Prisma imports still in some components** - possible import errors
5. **Hydration mismatches** - client/server rendering differences

### Database Issues

1. **Replaced Prisma with better-sqlite3** but some query functions may be incomplete
2. **No spaced repetition tables** in actual database - Mastery, Review, DailyProgress don't exist
3. **study/review routes missing** - study page links to `/study/review` but route doesn't exist

### Component Issues

1. **ThemeProvider still exists but unused** - TopNav has its own theme handling
2. **Sidebar.tsx exists but unused** - TopNav replaced it but old component remains
3. **BrowseContent.tsx and ChunkCard.tsx in components/chunks** - may have old Prisma references

### UI/UX Issues

1. **Settings page theme buttons don't work** - need client-side state
2. **No search page** - TopNav links to `/search` which doesn't exist
3. **Progress page shows 0 for mastered/streak** - no data in database

---

## Priority Tasks

### P0 - Fix Breaking Issues (Must Fix)

- [ ] Fix `--danger` → `--destructive` in dashboard StatCard
- [ ] Update settings page to remove Prisma mention
- [ ] Fix hydration errors in browse page
- [ ] Create missing `/search` route or remove link from TopNav

### P1 - Core Functionality (Should Fix)

- [ ] Make settings theme buttons actually work (needs 'use client')
- [ ] Create working study/review route
- [ ] Clean up unused components (Sidebar, ThemeProvider, BrowseContent, ChunkCard)
- [ ] Remove old Prisma query files from src/lib/db/queries/

### P2 - Database/Data (Nice to Have)

- [ ] Update SQLite query functions to handle missing tables gracefully
- [ ] Add proper error boundaries for database errors
- [ ] Consider adding spaced repetition tables to database

### P3 - Polish (Nice to Have)

- [ ] Add loading skeletons for better UX
- [ ] Add error pages (404, 500)
- [ ] Improve mobile responsiveness
- [ ] Add empty states for no-data situations

---

## Technical Debt

### Files to Remove

- `src/components/layout/Sidebar.tsx` - replaced by TopNav
- `src/components/providers/ThemeProvider.tsx` - TopNav handles theme
- `src/components/chunks/BrowseContent.tsx` - inline in page now
- `src/components/chunks/ChunkCard.tsx` - inline in page now
- `src/lib/db/queries/` - old Prisma queries
- `src/lib/db/prisma.ts` - no longer using Prisma
- `prisma/` folder - no longer using Prisma

### Files to Update

- `src/app/page.tsx` - fix `--danger` → `--destructive`
- `src/app/settings/page.tsx` - remove Prisma mention, make interactive
- `src/app/layout.tsx` - ensure TopNav is properly imported

### CSS Variables to Verify

```css
/* Current */
--destructive: #ef4444;

/* Should add for consistency */
--danger: #ef4444; /* OR change dashboard to use --destructive */
```

---

## Implementation Order

```
1. Fix dashboard CSS variable (2 min)
2. Update settings page text (1 min)
3. Remove unused file imports (5 min)
4. Create search page OR remove link (10 min)
5. Make settings theme interactive (15 min)
6. Create study/review route (20 min)
7. Clean up old files (10 min)
8. Test all routes (15 min)
```

---

## Questions to Resolve

1. Should we keep Prisma for future use or remove completely?
2. Do you want a working spaced repetition system with local storage?
3. What features are most important to fix first?
