import { Navbar } from "@/components/navbar";
import { GlassPanel } from "@/components/ui/glass";
import { Skeleton } from "@/components/ui/skeleton";

export default function DoctorProfileLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      <div className="pointer-events-none absolute top-[10%] left-[5%] h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] dark:bg-[#357d60]/15" />
      <div className="pointer-events-none absolute bottom-[10%] right-[10%] h-[600px] w-[600px] rounded-full bg-white/50 blur-[120px] dark:bg-[#4a9b7a]/15" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
        {/* Doctor header card */}
        <GlassPanel className="p-8">
          <div className="flex items-center gap-6 mb-8">
            <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-56" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
          </div>
          {/* Bio */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </GlassPanel>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Booking panel */}
          <GlassPanel className="lg:col-span-2 p-6 space-y-4">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </GlassPanel>

          {/* Sidebar */}
          <div className="space-y-4">
            <GlassPanel className="p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-36" />
            </GlassPanel>
          </div>
        </div>
      </main>
    </div>
  );
}
