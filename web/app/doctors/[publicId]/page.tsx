import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SPRING = "http://localhost:8080";

// ─── Types ────────────────────────────────────────────────────────────────────

type DoctorProfile = {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  specializations: string[];
  bio: string | null;
  licenseNumber: string | null;
  photoUrl: string | null;
  public: boolean;
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

// ─── Minimal public header ────────────────────────────────────────────────────

function PublicHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#102240]">
            <span className="text-xs font-black text-[#36A372]">CB</span>
          </div>
          <span className="font-bold text-foreground">ClearBook</span>
        </Link>
        <Link
          href="/auth"
          className="text-sm font-medium text-accent hover:underline"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DoctorPublicProfile({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  const res = await fetch(`${SPRING}/api/doctors/${publicId}`, {
    cache: "no-store",
  });

  if (!res.ok) notFound();

  const doctor: DoctorProfile = await res.json();
  if (!doctor.public) notFound();

  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column — identity */}
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h1>
                {doctor.licenseNumber && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    License: {doctor.licenseNumber}
                  </p>
                )}
              </div>

              {/* Specializations */}
              {doctor.specializations.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {doctor.specializations.map((s) => (
                    <Badge key={s} variant="accent" className="text-xs">
                      {SPEC_LABELS[s] ?? s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Bio */}
            {doctor.bio ? (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-3 font-semibold text-foreground">About</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {doctor.bio}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  This doctor has not added a bio yet.
                </p>
              </div>
            )}

            {/* Book CTA */}
            <div className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 p-5">
              <div>
                <p className="font-semibold text-foreground">
                  Book an appointment
                </p>
                <p className="text-sm text-muted-foreground">
                  Create an account or sign in to book with Dr.{" "}
                  {doctor.lastName}.
                </p>
              </div>
              <Link
                href="/auth"
                className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-dark transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
