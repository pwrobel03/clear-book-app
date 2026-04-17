import Link from "next/link";
import { Building2, MapPin, Phone, Mail, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SPRING = "http://localhost:8080";

// ─── Types ────────────────────────────────────────────────────────────────────

type MedicalCenter = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  type: string;
  status: string;
};

type PageResult = {
  content: MedicalCenter[];
  totalElements: number;
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  CLINIC: "Clinic",
  HOSPITAL: "Hospital",
  PRIVATE_PRACTICE: "Private Practice",
  DIAGNOSTIC_CENTER: "Diagnostic Center",
  REHABILITATION_CENTER: "Rehabilitation Center",
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#102240]">
            <span className="text-xs font-black text-[#36A372]">CB</span>
          </div>
          <span className="font-bold text-foreground">ClearBook</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/doctors"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Find a Doctor
          </Link>
          <Link
            href="/auth"
            className="text-sm font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Center card ──────────────────────────────────────────────────────────────

function CenterCard({ center }: { center: MedicalCenter }) {
  return (
    <Link
      href={`/centers/${center.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-accent/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Building2 size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground group-hover:text-accent transition-colors">
              {center.name}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              {center.address}, {center.city}
            </p>
          </div>
        </div>
        <Badge variant="muted" className="shrink-0">
          {TYPE_LABELS[center.type] ?? center.type}
        </Badge>
      </div>

      {center.description && (
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {center.description}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {center.phone && (
          <span className="flex items-center gap-1">
            <Phone size={11} />
            {center.phone}
          </span>
        )}
        {center.email && (
          <span className="flex items-center gap-1">
            <Mail size={11} />
            {center.email}
          </span>
        )}
      </div>

      <span className="mt-auto text-xs font-medium text-accent">
        View center →
      </span>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CentersListPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city = "" } = await searchParams;

  const params = new URLSearchParams({ size: "24" });
  if (city) params.set("city", city);

  let result: PageResult = { content: [], totalElements: 0 };
  try {
    const res = await fetch(`${SPRING}/api/centers?${params}`, {
      cache: "no-store",
    });
    if (res.ok) result = await res.json();
  } catch {
    // Spring unavailable
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Filter bar */}
      <div className="border-b border-border bg-card py-6">
        <div className="mx-auto max-w-5xl px-6">
          <form method="GET" className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <input
                name="city"
                defaultValue={city}
                placeholder="Filter by city…"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-dark transition-colors"
            >
              <Search size={15} />
              Filter
            </button>
            {city && (
              <Link
                href="/centers"
                className="flex items-center px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </Link>
            )}
          </form>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">
            Medical Centers
          </h1>
          <p className="text-sm text-muted-foreground">
            {result.totalElements} center{result.totalElements !== 1 ? "s" : ""} available
            {city && ` in ${city}`}
          </p>
        </div>

        {/* Grid */}
        {result.content.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Building2 size={24} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No centers found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {city
                  ? `No active centers in "${city}". Try a different city.`
                  : "No active medical centers available yet."}
              </p>
            </div>
            {city && (
              <Link href="/centers" className="text-sm font-medium text-accent hover:underline">
                Show all centers
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.content.map((center) => (
              <CenterCard key={center.id} center={center} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
