# ChunksWeb Reformulation Plan

## Current Issues (as reported by user)

- "Everything" needs redesign
- Layout and functionality are not good

---

## Design Philosophy

**Goal:** Create a clean, focused learning interface that prioritizes:

1. **Clarity** - Clear visual hierarchy, no clutter
2. **Action** - Every element leads to a clear next step
3. **Progress** - Constant feedback on learning journey
4. **Flow** - Seamless transitions between learning modes

---

## New Layout Architecture

### 1. Navigation: Top Navigation Bar (replaces Sidebar)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Home   Browse   Study   Progress    [Search] [⚙️]    │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**

- More screen real estate for content
- Better mobile experience
- Cleaner visual hierarchy
- Easier to scale navigation items

### 2. Dashboard: "Today" Focused

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Welcome back, Matheus                          [Start Now ▶] │
│   5 chunks due for review · 3 new available                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │   5 due     │  │  12 learned │  │   🔥 7      │           │
│   │   today     │  │   today     │  │   streak    │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [📚 Review Now]    [✨ Learn New]    [🎯 Feynman Mode]      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Recent Activity                                               │
│   ─────────────────────────────────────────────────────────     │
│   ✓ Reviewed "as well as" - Easy                                │
│   ✓ Learned "on the other hand"                                  │
│   ✓ Reviewed "in addition to" - Good                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Categories                                                    │
│   ─────────────────────────────────────────────────────────     │
│   [Foundation]  [Basic]  [Advanced]                            │
│                                                                 │
│   Foundation  ████████████████████░░░░░  45/60                   │
│   Basic       ██████████████░░░░░░░░░  28/80                   │
│   Advanced    ████░░░░░░░░░░░░░░░░░░░   5/40                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Browse Page: Filter-First Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Browse Chunks                              [Filters] [Sort] │
│                                                                 │
│   ┌─────────────────────────────────────────────┐              │
│   │ 🔍 Search chunks, patterns, meanings...     │              │
│   └─────────────────────────────────────────────┘              │
│                                                                 │
│   [Level ▼]  [Category ▼]  [Type ▼]  [Status ▼]               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Showing 24 of 180 chunks                    [Grid] [List]    │
│                                                                 │
│   ┌──────────────────┐  ┌──────────────────┐                     │
│   │                  │  │                  │                     │
│   │  "as well as"   │  │  "on the other   │                     │
│   │  ━━━━━━━━━━      │  │   hand"         │                     │
│   │                  │  │  ━━━━━━━━━━      │                     │
│   │  conjunction    │  │                  │                     │
│   │  Foundation     │  │  conjunction     │                     │
│   │                  │  │  Basic          │                     │
│   │  [▶ Review]      │  │                  │                     │
│   │  [○ Details]     │  │  [▶ Review]      │                     │
│   └──────────────────┘  │  [○ Details]     │                     │
│                        └──────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Chunk Detail Page: Card-Based Info

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ◀ Back to Browse                                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  "as well as"                          [Review] [Fav]   │   │
│  │  ─────────────────────────────────────────────          │   │
│  │                                                         │   │
│  │  Meaning                                                 │   │
│  │  usado para adicionar informação similar                │   │
│  │                                                         │   │
│  │  Examples                                                │   │
│  │  ─────────────                                           │   │
│  │  • "I like tea as well as coffee"                       │   │
│  │  • "The book as well as the movie was good"             │   │
│  │                                                         │   │
│  │  Variations                                              │   │
│  │  ───────────                                             │   │
│  │  • in addition to                                        │   │
│  │  • along with                                            │   │
│  │                                                         │   │
│  │  Context                                                 │   │
│  │  ────────                                                │   │
│  │  Used to connect two similar ideas or items             │   │
│  │                                                         │   │
│  │  Mastery: ████████░░ 80%   Next review: Tomorrow        │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Study/Review Interface: Focused Learning

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│           ┌─────────────────────────────┐                     │
│           │                             │                     │
│           │                             │                     │
│           │       "as well as"          │                     │
│           │                             │                     │
│           │       (click to flip)       │                     │
│           │                             │                     │
│           └─────────────────────────────┘                     │
│                                                                 │
│           Meaning: similar to "also" / "too"                   │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │  How well did you know this?                         │    │
│   │                                                       │    │
│   │  [Again]   [Hard]   [Good]   [Easy]                  │    │
│   │                                                       │    │
│   │   < 1m    ~10m    1d      4d                          │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│              Progress: 3/15 · Streak: 7 🔥                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Redesign

### Stats Cards (Dashboard)

- Larger numbers with unit labels
- Progress indicators (bars/rings)
- Action buttons embedded
- Color-coded by type

### Chunk Cards (Browse)

- Larger chunk text (24px+)
- Clear level indicator (colored badge)
- Quick action buttons (Review, Details)
- Optional: mastery indicator
- Hover effect with subtle elevation

### Navigation

- Horizontal top bar (desktop)
- Bottom bar (mobile) - similar to mobile apps
- Active state with underline + bold
- Icons with labels

### Buttons

- Primary: filled with text
- Secondary: outlined
- Ghost: minimal, just text + icon
- Clear hierarchy with size variants

---

## Implementation Plan

### Phase 1: Foundation

- [ ] Redesign layout structure (remove sidebar, add top nav)
- [ ] Create new app shell with horizontal navigation
- [ ] Update global styles for new layout

### Phase 2: Dashboard

- [ ] Redesign dashboard cards
- [ ] Add progress visualization
- [ ] Create action-oriented layout

### Phase 3: Browse

- [ ] Redesign chunk cards (grid layout)
- [ ] Improve search UX
- [ ] Add better filter UI

### Phase 4: Detail

- [ ] Redesign chunk detail page
- [ ] Better example display
- [ ] Clear action buttons

### Phase 5: Study

- [ ] Clean review interface
- [ ] Better feedback flow
- [ ] Progress indicators

---

## Technical Changes

### Layout Components

- Create `TopNav.tsx` component (replaces Sidebar)
- Create `MobileNav.tsx` (bottom navigation)
- Create `AppShell.tsx` (layout wrapper)

### Page Components

- Create new `Dashboard.tsx`
- Create new `ChunkGrid.tsx` (browse)
- Create new `ChunkDetail.tsx`

### UI Components

- Update `Card` variants
- Create `StatCard` component
- Create `ProgressBar` component
- Create `ActionButton` component

---

## Color Scheme Updates

Use CSS variables for theming:

```css
--primary: #3b82f6 (blue) --success: #22c55e (green) --warning: #f59e0b (amber) --danger: #ef4444
  (red) --foundation: #8b5cf6 (purple) --basic: #06b6d4 (cyan) --advanced: #f97316 (orange);
```

---

## Responsive Breakpoints

- **Mobile**: < 640px (bottom nav, stacked cards)
- **Tablet**: 640px - 1024px (top nav, 2-col grid)
- **Desktop**: > 1024px (top nav, 3-4 col grid)

---

## File Structure (After Reformulation)

```
src/
├── app/
│   ├── layout.tsx          (main layout with top nav)
│   ├── page.tsx            (dashboard)
│   ├── browse/
│   │   └── page.tsx
│   ├── chunk/[id]/
│   │   └── page.tsx
│   ├── study/
│   │   ├── page.tsx        (study modes selection)
│   │   └── review/
│   │       └── page.tsx    (spaced repetition)
│   └── progress/
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── TopNav.tsx
│   │   ├── MobileNav.tsx
│   │   └── AppShell.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── QuickActions.tsx
│   │   └── RecentActivity.tsx
│   ├── chunks/
│   │   ├── ChunkGrid.tsx
│   │   ├── ChunkCard.tsx
│   │   └── ChunkDetail.tsx
│   └── study/
│       ├── ReviewCard.tsx
│       └── FeynmanMode.tsx
└── lib/
    └── ...
```

---

## Next Steps

1. Create new layout components (TopNav, AppShell)
2. Update main layout to use new structure
3. Redesign dashboard page
4. Test and iterate

Total estimated files to create/modify: ~15-20 files
