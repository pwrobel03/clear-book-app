import { notFound } from "next/navigation";
import {
  Building2,
  MapPin,
  ArrowLeft,
  CalendarDays,
  Award,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDoctorByPublicIdAction,
  getDoctorAffiliatedCentersAction,
  getSpecializationsAction,
} from "@/lib/actions/doctor";
import { DoctorBookingClient } from "./booking-client";

// TODO: This page is the public profile of a doctor. It shows basic information about the doctor (name, specializations, bio) and a CTA to book an appointment (which leads to the auth page for now, since only authenticated users will be able to book appointments). If the doctor has chosen to keep their profile private, we show a message saying that the profile is private and they should contact the medical facility directly.

// TODO: We should also add some kind of notification system to notify doctor when they receive a new invitation, but for now they will have to check the "My Centers" page manually to see if they received any new invitations.

// TODO: We should also add some kind of "Share this doctor" functionality to this page (like sharing the doctor profile link on social media, etc.) but we will implement that in the future, so for now it's just a simple page without any sharing features.

// TODO: We should also add some kind of "Write a review" functionality to this page, so users can share their experience with the doctor and help other users make informed decisions, but we will implement that in the future, so for now it's just a simple page without any review features. User have to had a verified appointment with the doctor to be able to write a review, but we will implement that in the future, so for now it's just a simple page without any review features.

// TODO: We should also add some kind of "View on map" functionality to this page, so users can see the location of the medical facilities where the doctor works on a map and get directions to them, but we will implement that in the future, so for now it's just a simple page without any map features.

// TODO: We should split this page into multiple subpages (public profile, reviews, etc.) but for now we will keep everything in one place to speed up development.

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  const [doctorResult, centers, specResult] = await Promise.all([
    getDoctorByPublicIdAction(publicId),
    getDoctorAffiliatedCentersAction(publicId),
    getSpecializationsAction(),
  ]);

  // 404 - doctor not found
  if (doctorResult.error && doctorResult.error.includes("not found")) {
    notFound();
  }

  // Private profile - doctor exists but has chosen to keep their profile private
  if (doctorResult.error === "PRIVATE_PROFILE") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
        <div className="pointer-events-none absolute top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[140px] dark:bg-primary/10" />
        <div className="pointer-events-none absolute bottom-[10%] right-[10%] h-[600px] w-[600px] rounded-full bg-accent/20 blur-[140px] dark:bg-accent/15" />

        <Navbar />

        <main className="relative z-10 mx-auto w-full max-w-2xl px-6 py-24 text-center flex-1">
          <GlassPanel className="p-10 md:p-14">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-black/5 dark:bg-white/5 shadow-inner border border-black/5 dark:border-white/10">
              <Lock size={40} className="text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Private Profile
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The doctor you are trying to view has chosen to keep their profile
              private. If you are a patient trying to book an appointment,
              please contact the medical facility directly for assistance.
            </p>
            <div className="mt-10">
              <Link href="/doctors">
                <Button
                  variant="outline"
                  className="gap-2 rounded-2xl h-12 px-8 bg-white/50 dark:bg-black/20 backdrop-blur-md shadow-sm border-white/40 dark:border-white/10 transition-all hover:bg-white/80 dark:hover:bg-white/10"
                >
                  <ArrowLeft size={16} /> Back to doctors list
                </Button>
              </Link>
            </div>
          </GlassPanel>
        </main>
      </div>
    );
  }

  const doctor = doctorResult.data!;

  const specLabels: Record<string, string> = {};
  if (specResult.data) {
    specResult.data.forEach((s) => (specLabels[s.code] = s.name));
  }

  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`.toUpperCase();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      {/* ── ATMOSPHERIC BLOBS ── */}
      <div className="pointer-events-none absolute top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[140px] dark:bg-primary/10" />
      <div className="pointer-events-none absolute bottom-[10%] right-[10%] h-[600px] w-[600px] rounded-full bg-accent/20 blur-[140px] dark:bg-accent/15" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10 flex-1">
        <Link
          href="/doctors"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          Back to Search
        </Link>

        {/* Private profile notice */}
        {!doctor.public && (
          <GlassPanel className="mb-8 border-warning/60 bg-warning/60 p-5">
            <div className="flex items-center gap-3 text-warning-foreground font-medium text-sm">
              <Lock size={18} className="shrink-0" />
              <p>
                You are viewing a private profile. This doctor has chosen not to
                display their profile publicly.
              </p>
            </div>
          </GlassPanel>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Profile & Info */}
          <div className="lg:col-span-2 space-y-8">
            <GlassPanel className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="h-32 w-32 shrink-0 rounded-3xl bg-primary flex items-center justify-center text-4xl font-black text-primary-foreground shadow-2xl">
                  {initials}
                </div>
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h1>
                    {doctor.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {doctor.specializations.map((s) => (
                          <Badge
                            key={s}
                            variant="accent"
                            className="px-3 py-1 shadow-sm"
                          >
                            {specLabels[s] ?? s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {doctor.licenseNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <Award size={16} className="text-accent" />
                      License: {doctor.licenseNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  About the Doctor
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                  {doctor.bio ?? "This doctor hasn't provided a biography yet."}
                </p>
              </div>
            </GlassPanel>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Building2 size={20} />
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  Affiliated Centers
                </h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {centers.length === 0 ? (
                  <GlassPanel className="sm:col-span-2 py-10 text-center border-dashed">
                    <p className="text-muted-foreground">
                      No affiliated centers listed.
                    </p>
                  </GlassPanel>
                ) : (
                  centers.map((center) => (
                    <Link key={center.id} href={`/centers/${center.id}`}>
                      <GlassCard className="p-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 shadow-sm">
                          <Building2
                            size={22}
                            className="text-primary dark:text-primary-light"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-accent transition-colors">
                            {center.name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin size={12} /> {center.city}
                          </p>
                        </div>
                      </GlassCard>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Booking Widget Placeholder */}
          <div className="space-y-8">
            <GlassPanel className="p-8 sticky top-24 border-accent/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg">
                  <CalendarDays size={20} />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Book Appointment
                </h3>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Create an account or sign in to book with Dr.{" "}
                  {doctor.lastName}.
                </p>

                <Link
                  href="/auth"
                  className="flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 font-bold text-accent-foreground shadow-lg transition-colors hover:bg-accent-dark"
                >
                  Get started
                </Link>
              </div>
            </GlassPanel>
          </div>
        </div>
        <DoctorBookingClient doctorId={publicId} />
      </main>
    </div>
  );
}
