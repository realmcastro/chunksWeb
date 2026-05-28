# Plan: Login-Required Study System

## Context

Currently, users can access all study features without being logged in. The study functionality (progress tracking, streak, SM-2 algorithm) requires user identification to work properly. Without login, users can only browse limited content.

## Goal

- **Guest users**: Can only view limited content (browse chunks, grammar)
- **Logged-in users**: Full access to all study features

## Access Levels

### Guest (Not Logged In)

- ✅ Can browse `/browse` - View chunks (limited preview)
- ✅ Can view `/grammar` - Grammar structures
- ✅ Can view chunk details `/chunk/[id]` - Limited info
- ❌ Cannot access `/study/*` - Redirects to login
- ❌ Cannot access `/progress` - Redirects to login
- ❌ No progress tracking
- ❌ No streak calculation
- ❌ No study sessions recorded

### Logged In

- ✅ Full access to `/browse`
- ✅ Full access to `/grammar`
- ✅ Full access to `/study/*` - All study modes
- ✅ Full access to `/progress` - Progress stats
- ✅ Progress tracking per user
- ✅ Streak calculation
- ✅ Study sessions recorded

## Implementation

### Step 1: Protect Study Routes

Create middleware or update pages to check auth:

```typescript
// middleware.ts or page-level check
const { user } = useAuth();
if (!user && isStudyRoute(pathname)) {
  redirect('/login?redirect=' + pathname);
}
```

### Step 2: Update /study Page

```tsx
// src/app/study/page.tsx
'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { redirect } from 'next/navigation';

export default function StudyPage() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    redirect('/login?redirect=/study');
  }

  // ... existing study page content
}
```

### Step 3: Protect All Study Sub-routes

- `/study/review` - Requires login
- `/study/random` - Requires login
- `/study/learn` - Requires login
- `/study/feynman` - Requires login
- `/study/quick` - Requires login

### Step 4: Update /progress Page

```tsx
// src/app/progress/page.tsx
if (!loading && !user) {
  redirect('/login?redirect=/progress');
}
```

### Step 5: Add Login Redirect Param

Update login page to accept `?redirect=` param:

```tsx
// src/app/login/page.tsx
const router = useRouter();
const searchParams = useSearchParams();
const redirectTo = searchParams.get('redirect') || '/';

// After successful login
router.push(redirectTo);
```

## Files to Modify

| File                             | Changes                                   |
| -------------------------------- | ----------------------------------------- |
| `src/app/study/page.tsx`         | Add auth check, redirect if not logged in |
| `src/app/study/review/page.tsx`  | Add auth check                            |
| `src/app/study/random/page.tsx`  | Add auth check                            |
| `src/app/study/learn/page.tsx`   | Add auth check                            |
| `src/app/study/feynman/page.tsx` | Add auth check                            |
| `src/app/study/quick/page.tsx`   | Add auth check                            |
| `src/app/progress/page.tsx`      | Add auth check                            |
| `src/app/login/page.tsx`         | Handle redirect param                     |

## UX Flow

1. Guest visits `/study` → Redirects to `/login?redirect=/study`
2. User logs in → Redirects back to `/study`
3. Guest tries to access `/study/review` directly → Redirects to login
4. After login → Redirects to `/study/review`

## Test Plan

1. Without login, visit `/study` → Redirects to login
2. Without login, visit `/progress` → Redirects to login
3. Without login, visit `/browse` → Works normally
4. After login, visit `/study` → Shows study options
5. Login redirect param works correctly
