import Link from "next/link";
import { Building2, MapPin, Phone, Mail, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { getCentersAction } from "@/lib/actions/centers";
import { TYPE_LABELS } from "@/lib/constants/labels";
import type { MedicalCenterResponse } from "@/types/api";

function CenterCard({ center }: { center: MedicalCenterResponse }) {
  return (
    <Link href={`/centers/${center.id}`} className="block h-full">
      <GlassCard className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
              <Building2
                size={22}
                className="text-primary dark:text-primary-light"
              />
            </div>
            <div>
              <p className="font-bold text-foreground group-hover:text-accent transition-colors text-lg">
                {center.name}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <MapPin size={14} />
                {center.address}, {center.city}
              </p>
            </div>
          </div>
          <Badge variant="muted" className="shrink-0 shadow-sm">
            {TYPE_LABELS[center.type] ?? center.type}
          </Badge>
        </div>

        {center.description && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2 mt-2">
            {center.description}
          </p>
        )}

        <div className="mt-auto pt-4 flex flex-wrap gap-4 text-xs text-muted-foreground font-medium">
          {center.phone && (
            <span className="flex items-center gap-1.5">
              <Phone size={14} /> {center.phone}
            </span>
          )}
          {center.email && (
            <span className="flex items-center gap-1.5">
              <Mail size={14} /> {center.email}
            </span>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}

export default async function CentersListPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city = "" } = await searchParams;
  const result = await getCentersAction(city);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      {/* ── ATMOSPHERIC BLOBS ── */}
      <div className="pointer-events-none absolute top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] dark:bg-[#357d60]/15" />
      <div className="pointer-events-none absolute bottom-[10%] right-[10%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] dark:bg-[#4a9b7a]/15" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10 flex-1 flex flex-col">
        {/* Filter bar */}
        <GlassPanel className="mb-10 p-4">
          <form
            method="GET"
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <input
                name="city"
                defaultValue={city}
                placeholder="Filter by city…"
                className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 px-4 py-3 text-sm text-foreground shadow-sm backdrop-blur-md transition-all placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent hover:bg-black/[0.05] dark:hover:bg-white/10"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex h-11 items-center gap-2 rounded-2xl bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-md transition-all hover:bg-accent-dark hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              >
                <Search size={16} /> Filter
              </button>
              {city && (
                <Link
                  href="/centers"
                  className="flex h-11 items-center px-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>
        </GlassPanel>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Medical Centers
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {result.totalElements} center{result.totalElements !== 1 ? "s" : ""}{" "}
            available
            {city && ` in ${city}`}
          </p>
        </div>

        {/* Grid */}
        {result.content.length === 0 ? (
          <GlassPanel className="flex flex-col items-center gap-4 py-20 text-center border-dashed">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
              <Building2
                size={32}
                className="text-primary dark:text-primary-light"
              />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                No centers found
              </p>
              <p className="mt-2 text-base text-muted-foreground">
                {city
                  ? `No active centers in "${city}". Try a different city.`
                  : "No active medical centers available yet."}
              </p>
            </div>
            {city && (
              <Link
                href="/centers"
                className="mt-2 text-sm font-bold text-accent hover:underline"
              >
                Show all centers
              </Link>
            )}
          </GlassPanel>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {result.content.map((center) => (
              <CenterCard key={center.id} center={center} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
