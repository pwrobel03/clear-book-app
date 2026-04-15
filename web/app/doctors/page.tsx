import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import {
  HeroSearch,
  type SpecializationOption,
} from "@/components/landing/hero-search";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";

const SPRING = "http://localhost:8080";

// ─── Types ────────────────────────────────────────────────────────────────────

type DoctorProfile = {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  specializations: string[];
  bio: string | null;
  photoUrl: string | null;
};

type PageResult = {
  content: DoctorProfile[];
  totalElements: number;
  totalPages: number;
};

// ─── Specialization labels ────────────────────────────────────────────────────

const SPEC_LABELS: Record<string, string> = {
  CARDIOLOGY: "Cardiology",
  NEUROLOGY: "Neurology",
  ORTHOPEDICS: "Orthopedics",
  PEDIATRICS: "Pediatrics",
  DERMATOLOGY: "Dermatology",
  GYNECOLOGY: "Gynecology",
  PSYCHIATRY: "Psychiatry",
  OPHTHALMOLOGY: "Ophthalmology",
  RADIOLOGY: "Radiology",
  ONCOLOGY: "Oncology",
  EMERGENCY_MEDICINE: "Emergency Medicine",
  INTERNAL_MEDICINE: "Internal Medicine",
  SURGERY: "Surgery",
  UROLOGY: "Urology",
  ENDOCRINOLOGY: "Endocrinology",
  GASTROENTEROLOGY: "Gastroenterology",
  PULMONOLOGY: "Pulmonology",
  RHEUMATOLOGY: "Rheumatology",
  NEPHROLOGY: "Nephrology",
  HEMATOLOGY: "Hematology",
  ANESTHESIOLOGY: "Anesthesiology",
  FAMILY_MEDICINE: "Family Medicine",
};

// ─── Doctor card ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor }: { doctor: DoctorProfile }) {
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`.toUpperCase();

  return (
    <Link
      href={`/doctors/${doctor.publicId}`}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-accent/40 hover:shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-foreground group-hover:text-accent transition-colors">
            Dr. {doctor.firstName} {doctor.lastName}
          </p>
          {doctor.specializations.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {doctor.specializations
                .slice(0, 2)
                .map((s) => SPEC_LABELS[s] ?? s)
                .join(", ")}
              {doctor.specializations.length > 2 &&
                ` +${doctor.specializations.length - 2}`}
            </p>
          )}
        </div>
      </div>

      {/* Specialization badges */}
      {doctor.specializations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {doctor.specializations.slice(0, 3).map((s) => (
            <Badge key={s} variant="accent" className="text-xs">
              {SPEC_LABELS[s] ?? s}
            </Badge>
          ))}
        </div>
      )}

      {/* Bio preview */}
      {doctor.bio && (
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {doctor.bio}
        </p>
      )}

      <span className="mt-auto text-xs font-medium text-accent">
        View profile →
      </span>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DoctorsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ specialization?: string; city?: string }>;
}) {
  const { specialization = "", city = "" } = await searchParams;

  const params = new URLSearchParams({ size: "12" });
  if (specialization) params.set("specialization", specialization);
  if (city) params.set("city", city);

  // Fetch specializations for the search form
  let specializations: SpecializationOption[] = [];
  try {
    const sRes = await fetch(`${SPRING}/api/specializations`, {
      cache: "no-store",
    });
    if (sRes.ok) specializations = await sRes.json();
  } catch {
    /* ignore */
  }

  let result: PageResult = { content: [], totalElements: 0, totalPages: 0 };
  try {
    const res = await fetch(`${SPRING}/api/doctors?${params}`, {
      cache: "no-store",
    });
    if (res.ok) {
      result = await res.json();
    } else {
      // WYPISZE BŁĄD SPRINGA W TERMINALU NEXT.JS
      console.error("Backend zwrócił błąd:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Błąd połączenia z backendem:", err);
  }

  const hasFilters = !!specialization || !!city;
  const activeSpecLabel = specialization
    ? (SPEC_LABELS[specialization] ?? specialization)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Search bar */}
      <div className="border-b border-border bg-card py-6">
        <div className="mx-auto max-w-5xl px-6">
          <HeroSearch
            specializations={specializations}
            defaultSpecialization={specialization}
            defaultCity={city}
          />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Results header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {hasFilters ? "Search Results" : "All Doctors"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {result.totalElements} doctor
              {result.totalElements !== 1 ? "s" : ""} found
              {activeSpecLabel && ` · ${activeSpecLabel}`}
              {city && ` · ${city}`}
            </p>
          </div>
          {hasFilters && (
            <Link
              href="/doctors"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              Clear filters
            </Link>
          )}
        </div>

        {/* Results grid */}
        {result.content.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Search size={24} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No doctors found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search filters or browse all available
                doctors.
              </p>
            </div>
            <Link
              href="/doctors"
              className="text-sm font-medium text-accent hover:underline"
            >
              Browse all doctors
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.content.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
