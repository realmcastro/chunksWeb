# Plan: Fix Login Session Recognition

## Problem

After successful login, the user is not being recognized as authenticated. The AuthProvider calls `/api/auth/me` to check the session, but after login the state isn't being updated properly.

## Root Cause

The login page successfully:

1. Calls `/api/auth/login` which sets the session cookie
2. Calls `router.push(redirectTo)` and `router.refresh()`

However, the `AuthProvider` on the new page doesn't re-check the session because:

1. The `useEffect` only runs on mount
2. The `router.refresh()` doesn't trigger a re-run of the `useEffect`
3. The user state remains `null` because it was set before the cookie was set

## Solution

Update the login page to call `checkAuth()` from the AuthProvider after successful login, OR update the AuthProvider to re-check auth when the page regains focus.

### Option 1: Call checkAuth after login (Simpler)

Update the login page to re-check auth after successful login:

```tsx
// In handleSubmit after successful login
router.push(redirectTo);
// Force checkAuth to run after navigation
setTimeout(() => window.location.reload(), 100);
```

### Option 2: Add visibility change listener to AuthProvider

```tsx
// In AuthProvider
useEffect(() => {
  checkAuth();

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkAuth();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### Option 3: Create login wrapper that handles session

Create a `LoginWrapper` component that wraps the login form and handles session refresh after login.

## Recommended Fix

**Option 2 + ensure cookies are httpOnly with correct settings.**

The visibility change listener will ensure that when the user returns to the tab after logging in, their session is re-checked. Also need to verify the cookie settings.

## Files to Modify

| File                                        | Changes                                         |
| ------------------------------------------- | ----------------------------------------------- |
| `src/components/providers/AuthProvider.tsx` | Add visibility change listener to re-check auth |
| `src/app/api/auth/login/route.ts`           | Verify cookie settings are correct              |

## Implementation Steps

### Step 1: Update AuthProvider to re-check on visibility change

```tsx
useEffect(() => {
  checkAuth();

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkAuth();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### Step 2: Verify cookie settings in login API

Ensure cookies are set with correct flags:

- `httpOnly: true` - Prevents JavaScript access
- `sameSite: 'lax'` - CSRF protection
- `secure: true` - HTTPS only (in production)
- `path: '/'` - Available on all paths

### Step 3: Test the flow

1. Clear all cookies
2. Visit `/study` - Should redirect to login
3. Register/Login
4. After login, should redirect to `/study` and be recognized as logged in
