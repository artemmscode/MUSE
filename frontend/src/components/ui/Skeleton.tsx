import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden="true" />;
}

export function TrackCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('w-full', className)}>
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <Skeleton className="mt-3.5 h-3.5 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-3 py-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="mt-2 h-3 w-1/4" />
      </div>
      <Skeleton className="hidden h-3 w-24 sm:block" />
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-12">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-10 w-64" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-[28px]" />
      <div className="space-y-5">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <TrackCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
