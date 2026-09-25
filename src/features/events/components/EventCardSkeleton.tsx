/**
 * Skeleton loading card for public Events pages.
 * Matches the exact geometry, aspect ratio, borders, and typography hierarchy of EventCard
 * to eliminate layout shifting during data hydration.
 */
export function EventCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      aria-hidden="true"
      className="glass-card rounded-xl overflow-hidden h-full flex flex-col border border-white/[0.07] bg-euphoria-surface/40 select-none pointer-events-none relative"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Ambient shimmer sweep */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.03] to-transparent bg-[length:200%_100%] animate-shimmer" />

      {/* 1. Poster/image area skeleton */}
      <div className="p-3 flex-shrink-0">
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-white/[0.04] animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="px-4 pb-4 pt-1 flex flex-col flex-1">
        {/* 2. Category label skeleton */}
        <div className="h-2.5 w-16 rounded bg-white/[0.07] animate-pulse" />

        {/* 3. Event title skeleton */}
        <div className="mt-2.5 space-y-1.5">
          <div className="h-4 w-4/5 rounded bg-white/[0.08] animate-pulse" />
          <div className="h-4 w-3/5 rounded bg-white/[0.05] animate-pulse" />
        </div>

        {/* 4. Event description skeleton */}
        <div className="mt-2.5 space-y-1.5">
          <div className="h-3 w-full rounded bg-white/[0.04] animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-white/[0.03] animate-pulse" />
        </div>

        {/* 5. View Event button area skeleton */}
        <div className="mt-auto pt-3">
          <div className="w-full h-[33px] rounded-md border border-white/[0.06] bg-white/[0.03] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
