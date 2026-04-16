import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import {
  HeroSearch,
  type SpecializationOption,
} from "@/components/landing/hero-search";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";

import {
  getDoctorsAction,
  getSpecializationsAction,
} from "@/lib/actions/doctor";
import type { DoctorProfileResponse } from "@/types/api";

// ─── Doctor card ──────────────────────────────────────────────────────────────
function DoctorCard({
  doctor,
  specLabels,
}: {
  doctor: DoctorProfileResponse;
  specLabels: Record<string, string>;
}) {
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
                .map((s) => specLabels[s] ?? s)
                .join(", ")}
              {doctor.specializations.length > 2 &&
                ` +${doctor.specializations.length - 2}`}
            </p>
          )}
        </div>
      </div>

      {doctor.specializations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {doctor.specializations.slice(0, 3).map((s) => (
            <Badge key={s} variant="accent" className="text-xs">
              {specLabels[s] ?? s}
            </Badge>
          ))}
        </div>
      )}

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

  const [doctorsResult, specResult] = await Promise.all([
    getDoctorsAction(specialization, city),
    getSpecializationsAction(),
  ]);

  // Budujemy dynamiczny słownik i listę dla wyszukiwarki na podstawie bazy
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
    <div className="min-h-screen bg-background">
      <Navbar />

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {hasFilters ? "Search Results" : "All Doctors"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {doctorsResult.totalElements} doctor
              {doctorsResult.totalElements !== 1 ? "s" : ""} found
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

        {doctorsResult.content.length === 0 ? (
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
