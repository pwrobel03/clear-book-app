import { Navbar } from "@/components/navbar";
import { GlassPanel } from "@/components/ui/glass";
import { Skeleton } from "@/components/ui/skeleton";

function CenterCardSkeleton() {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-6 flex flex-col gap-4">
      {/* Icon + name + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full shrink-0" />
      </div>
      {/* Description */}
      <div className="space-y-1.5 mt-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
      {/* Contact row */}
      <div className="mt-auto pt-4 flex gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
}

export default function CentersLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      <div className="pointer-events-none absolute top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] dark:bg-[#357d60]/15" />
      <div className="pointer-events-none absolute bottom-[10%] right-[10%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] dark:bg-[#4a9b7a]/15" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10 flex-1 flex flex-col">
        {/* Filter bar skeleton */}
        <GlassPanel className="mb-10 p-4">
          <Skeleton className="h-11 w-full rounded-2xl" />
        </GlassPanel>

        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-52 mb-3" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* 2-column grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CenterCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
