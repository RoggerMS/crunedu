export function CommunityCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? "w-[280px] max-w-[320px] min-w-[260px] flex-shrink-0" : "w-full"}`}>
      <div className="h-16 w-full animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="h-9 w-full animate-pulse rounded-xl bg-slate-200" />
      </div>
    </article>
  );
}
