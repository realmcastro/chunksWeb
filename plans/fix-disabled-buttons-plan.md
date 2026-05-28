# Plan: Fix Disabled Button Clickability Issue

## Problem

The `disabled` attribute on `<Button>` inside `<Link>` doesn't prevent clicking. The Link (`<a>` tag) remains clickable even when the button appears disabled.

In [`src/app/study/page.tsx`](src/app/study/page.tsx:44):

```tsx
<Link href="/study/review">
  <Button className="w-full" disabled={dueToday === 0}>
    {dueToday > 0 ? 'Start Review' : 'No Reviews Due'}
  </Button>
</Link>
```

The `disabled` prop only visually disables the button but doesn't prevent the anchor tag navigation.

## Solution

Replace Link+Button combinations with conditional rendering:

- When enabled: Render Link wrapping Button
- When disabled: Render just the Button with tooltip/tooltip-like text explaining why

## Implementation Steps

### Step 1: Create Helper Function for Disabled Button Messages

Add messages to show when buttons are disabled:

- Review Mode: "No chunks due for review yet" → links to /browse
- Feynman Mode: "Master at least 3 chunks first" → links to /study/review
- Quick Practice: "No practice due right now" → links to /browse

### Step 2: Modify Study Page

Use conditional rendering:

```tsx
{
  condition ? (
    <Link href="/path">
      <Button>Enabled text</Button>
    </Link>
  ) : (
    <Button disabled tooltip="Reason for being disabled">
      Disabled text
    </Button>
  );
}
```

Or use a more elegant approach with just the button that handles navigation conditionally:

```tsx
<Button
  disabled={!condition}
  onClick={() => router.push('/path')}
  title={!condition ? 'Why disabled' : ''}
>
  Text
</Button>
```

## Files to Modify

| File                     | Change                                                  |
| ------------------------ | ------------------------------------------------------- |
| `src/app/study/page.tsx` | Fix disabled button behavior with conditional rendering |

## Design Decisions

1. **Tooltip on hover**: Add `title` attribute to show why button is disabled
2. **Alternative action**: When disabled, show "Learn More" or "Browse" text instead of just disabled
3. **Visual indication**: Keep button visually disabled but with clear messaging

## Example Result

**Before:**

```tsx
<Link href="/study/review">
  <Button disabled={dueToday === 0}>{dueToday > 0 ? 'Start Review' : 'No Reviews Due'}</Button>
</Link>
```

**After:**

```tsx
{
  stats.dueToday > 0 ? (
    <Link href="/study/review">
      <Button className="w-full">Start Review</Button>
    </Link>
  ) : (
    <Button variant="outline" className="w-full" disabled title="Complete some reviews first!">
      No Reviews Due
    </Button>
  );
}
```
