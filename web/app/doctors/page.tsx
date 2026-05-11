import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import {
  HeroSearch,
  type SpecializationOption,
} from "@/components/landing/hero-search";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { GlassCard, GlassPanel } from "@/components/ui/glass";

import {
  getDoctorsAction,
  getSpecializationsAction,
} from "@/lib/actions/doctor";
import type { DoctorProfileResponse } from "@/types/api";

// TODO: This page is the main public directory of doctors. It shows a list of all doctors registered in the system with basic information about them (name, specializations, bio). Users can search for doctors by specialization and city. Each doctor card links to the doctor's public profile page.

// TODO: We should split this page into multiple subpages (search results, doctor profile, etc.) but for now we will keep everything in one place to speed up development.

// TODO: We should also add some filters to the search (like filtering by medical center, filtering by availability, etc.) but for now we will just have a simple search by specialization and city to speed up development.

// TODO: We should also add pagination to the search results, but for now we will just show all doctors in one page to speed up development.

function DoctorCard({
  doctor,
  specLabels,
}: {
  doctor: DoctorProfileResponse;
  specLabels: Record<string, string>;
}) {
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`.toUpperCase();

  return (
    <Link href={`/doctors/${doctor.publicId}`} className="block h-full">
      <GlassCard className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-inner text-lg font-bold text-primary-foreground">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
              Dr. {doctor.firstName} {doctor.lastName}
            </p>
            {doctor.specializations.length > 0 && (
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                {doctor.specializations
                  .slice(0, 2)
                  .map((s) => specLabels[s] ?? s)
                  .join(", ")}
                {doctor.specializations.length > 2 &&
                  ` +${doctor.specializations.length - 2}`}
              </p>
            )}
          </div>
        </div>

        {doctor.specializations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {doctor.specializations.slice(0, 3).map((s) => (
              <Badge key={s} variant="accent" className="text-xs shadow-sm">
                {specLabels[s] ?? s}
              </Badge>
            ))}
          </div>
        )}

        {doctor.bio && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2 mt-1">
            {doctor.bio}
          </p>
        )}
      </GlassCard>
    </Link>
  );
}

export default async function DoctorsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ specialization?: string; city?: string }>;
}) {
  const { specialization = "", city = "" } = await searchParams;

  const [doctorsResult, specResult] = await Promise.all([
    getDoctorsAction(specialization, city),
    getSpecializationsAction(),
  ]);

  const specLabels: Record<string, string> = {};
  const specializations: SpecializationOption[] = [];

  if (specResult.data) {
    specResult.data.forEach((s) => {
      specLabels[s.code] = s.name;
      specializations.push({ code: s.code, name: s.name });
    });
  }

  const hasFilters = !!specialization || !!city;
  const activeSpecLabel = specialization
    ? (specLabels[specialization] ?? specialization)
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      {/* ── ATMOSPHERIC BLOBS ── */}
      <div className="pointer-events-none absolute top-[15%] left-[5%] h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] dark:bg-[#357d60]/15" />
      <div className="pointer-events-none absolute bottom-[10%] right-[10%] h-[600px] w-[600px] rounded-full bg-white/50 blur-[120px] dark:bg-[#4a9b7a]/15" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10 flex-1 flex flex-col">
        <GlassPanel className="mb-10 p-4">
          <HeroSearch
            specializations={specializations}
            defaultSpecialization={specialization}
            defaultCity={city}
          />
        </GlassPanel>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {hasFilters ? "Search Results" : "All Doctors"}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {doctorsResult.totalElements} doctor
              {doctorsResult.totalElements !== 1 ? "s" : ""} found
              {activeSpecLabel && ` · ${activeSpecLabel}`}
              {city && ` · ${city}`}
            </p>
          </div>
          {hasFilters && (
            <Link
              href="/doctors"
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} /> Clear filters
            </Link>
          )}
        </div>

        {doctorsResult.content.length === 0 ? (
          <GlassPanel className="flex flex-col items-center gap-4 py-20 text-center border-dashed">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
              <Search
                size={32}
                className="text-primary dark:text-primary-light"
              />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                No doctors found
              </p>
              <p className="mt-2 text-base text-muted-foreground max-w-md mx-auto">
                Try adjusting your search filters or browse all available
                doctors.
              </p>
            </div>
            <Link
              href="/doctors"
              className="mt-2 text-sm font-bold text-accent hover:underline"
            >
              Browse all doctors
            </Link>
          </GlassPanel>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctorsResult.content.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                specLabels={specLabels}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
