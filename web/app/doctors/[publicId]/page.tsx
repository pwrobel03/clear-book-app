import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import {
  getDoctorByPublicIdAction,
  getSpecializationsAction,
} from "@/lib/actions/doctor";

// TODO: This page is the public profile of a doctor. It shows basic information about the doctor (name, specializations, bio) and a CTA to book an appointment (which leads to the auth page for now, since only authenticated users will be able to book appointments). If the doctor has chosen to keep their profile private, we show a message saying that the profile is private and they should contact the medical facility directly.

// TODO: We should also add some kind of notification system to notify doctor when they receive a new invitation, but for now they will have to check the "My Centers" page manually to see if they received any new invitations.

// TODO: We should also add some kind of "Share this doctor" functionality to this page (like sharing the doctor profile link on social media, etc.) but we will implement that in the future, so for now it's just a simple page without any sharing features.

// TODO: We should also add some kind of "Write a review" functionality to this page, so users can share their experience with the doctor and help other users make informed decisions, but we will implement that in the future, so for now it's just a simple page without any review features. User have to had a verified appointment with the doctor to be able to write a review, but we will implement that in the future, so for now it's just a simple page without any review features.

// TODO: We should also add some kind of "View on map" functionality to this page, so users can see the location of the medical facilities where the doctor works on a map and get directions to them, but we will implement that in the future, so for now it's just a simple page without any map features.

// TODO: We should split this page into multiple subpages (public profile, reviews, etc.) but for now we will keep everything in one place to speed up development.

export default async function DoctorPublicProfile({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  const [doctorResult, specResult] = await Promise.all([
    getDoctorByPublicIdAction(publicId),
    getSpecializationsAction(),
  ]);

  // Obsługa prawdziwego 404 (Lekarz nie istnieje w ogóle)
  if (doctorResult.error && doctorResult.error.includes("not found")) {
    notFound();
  }

  // Obsługa profilu prywatnego
  if (doctorResult.error === "PRIVATE_PROFILE") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Lock size={32} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Private profile
          </h1>
          <p className="mt-4 text-muted-foreground">
            The doctor you are trying to view has chosen to keep their profile
            private. If you are a patient trying to book an appointment, please
            contact the medical facility directly for assistance.
          </p>
          <div className="mt-10">
            <Link href="/doctors">
              <Button variant="outline" className="gap-2">
                <ArrowLeft size={16} /> Back to doctors list
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Public profile
  const doctor = doctorResult.data!;
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
        {/* If profile is private, show a warning (this can happen if doctor has a profile but it's not public) */}
        {!doctor.public && (
          <div className="mb-6 rounded-lg border border-warning/60 bg-warning/40 p-3 text-sm text-warning-foreground flex items-center gap-2">
            <Lock size={14} />
            You are viewing a private profile. This doctor has chosen not to
            display their profile publicly. If you are a patient, please contact
            the medical facility directly.
          </div>
        )}

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
