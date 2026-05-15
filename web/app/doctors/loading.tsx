import { Navbar } from "@/components/navbar";
import { GlassPanel } from "@/components/ui/glass";
import { Skeleton } from "@/components/ui/skeleton";

function DoctorCardSkeleton() {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-6 flex flex-col gap-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      {/* Specialty badges */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      {/* Bio */}
      <div className="space-y-2 mt-1">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}

export default function DoctorsLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      <div className="pointer-events-none absolute top-[15%] left-[5%] h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] dark:bg-[#357d60]/15" />
      <div className="pointer-events-none absolute bottom-[10%] right-[10%] h-[600px] w-[600px] rounded-full bg-white/50 blur-[120px] dark:bg-[#4a9b7a]/15" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10 flex-1 flex flex-col">
        {/* Search bar skeleton */}
        <GlassPanel className="mb-10 p-4">
          <Skeleton className="h-11 w-full rounded-2xl" />
        </GlassPanel>

        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-3" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Grid of cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DoctorCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
