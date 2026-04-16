import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";

import {
  getDoctorByPublicIdAction,
  getSpecializationsAction,
} from "@/lib/actions/doctor";

export default async function DoctorPublicProfile({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  // Równoległe pobranie lekarza oraz listy specjalizacji
  const [doctor, specResult] = await Promise.all([
    getDoctorByPublicIdAction(publicId),
    getSpecializationsAction(),
  ]);

  if (!doctor || !doctor.public) notFound();

  // Budujemy słownik
  const specLabels: Record<string, string> = {};
  if (specResult.data) {
    specResult.data.forEach((s) => {
      specLabels[s.code] = s.name;
    });
  }

  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column — identity */}
          <div className="space-y-6">
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

              {/* Specializations z bazy */}
              {doctor.specializations.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {doctor.specializations.map((s) => (
                    <Badge key={s} variant="accent" className="text-xs">
                      {specLabels[s] ?? s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — details */}
          <div className="space-y-6 lg:col-span-2">
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
