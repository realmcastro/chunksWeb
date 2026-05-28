import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function ProgressLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </div>
      <Skeleton className="h-64 w-full" rounded="lg" />
      <SkeletonCard lines={5} />
    </div>
  );
}
