import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';

/*
! Default Suspense fallback for any route that does not declare its own
! `loading.tsx`. Generic shell that mirrors the most common page shape
! (header + grid/list). Per-segment loaders should override this when the
! real content layout is known.
*/

export default function RootLoading() {
  return (
    <div className="space-y-6">
      <SkeletonCard lines={2} />
      <SkeletonList rows={6} />
    </div>
  );
}
