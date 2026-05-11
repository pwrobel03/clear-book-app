import { notFound } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { Badge } from "@/components/ui/badge";
import {
  getCenterByIdAction,
  getCenterMembersAction as getDoctorsInCenterAction,
} from "@/lib/actions/centers";
import { TYPE_LABELS } from "@/lib/constants/labels";

// TODO: This page is the public profile of a medical center. It shows basic information about the center (name, address, contact info) and a list of doctors working there. It's accessible to everyone, even non-authenticated users. We will add more information to it in the future (like opening hours, services offered, etc.) but for now it's just a simple profile page with basic info and doctors list.

// TODO: We should also add a "Book an appointment" CTA to this page, but we will implement the booking flow in the future, so for now it's just a placeholder link that leads to the auth page (since only authenticated users will be able to book appointments).

// TODO: We should also add some kind of notification system to notify doctor when they receive a new invitation, but for now they will have to check the "My Centers" page manually to see if they received any new invitations.

// TODO: We should also add some kind of "Share this center" functionality to this page (like sharing the center profile link on social media, etc.) but we will implement that in the future, so for now it's just a simple page without any sharing features.

// TODO: We should also add some kind of "Write a review" functionality to this page, so users can share their experience with the center and help other users make informed decisions, but we will implement that in the future, so for now it's just a simple page without any review features.

// TODO: We should also add some kind of "View on map" functionality to this page, so users can see the location of the center on a map and get directions to it, but we will implement that in the future, so for now it's just a simple page without any map features.
// web/app/centers/[id]/page.tsx

export default async function CenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [center, doctors] = await Promise.all([
    getCenterByIdAction(id),
    getDoctorsInCenterAction(id),
  ]);

  if (!center) notFound();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      {/* ── ATMOSPHERIC BLOBS ── */}
      <div className="pointer-events-none absolute top-[10%] right-[5%] h-[600px] w-[600px] rounded-full bg-accent/20 blur-[140px] dark:bg-[#357d60]/20" />
      <div className="pointer-events-none absolute bottom-[10%] left-[5%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] dark:bg-[#4a9b7a]/15" />

      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10 flex-1">
        <Link
          href="/centers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          Back to Centers
        </Link>

        {/* Main Center Info */}
        <GlassPanel className="p-8 md:p-12 mb-12">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg text-primary-foreground">
                  <Building2 size={32} />
                </div>
                <div>
                  <Badge variant="accent" className="mb-2 shadow-sm">
                    {TYPE_LABELS[center.type] ?? center.type}
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                    {center.name}
                  </h1>
                </div>
              </div>

              <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl">
                {center.description ??
                  "No description available for this medical center."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-foreground">
                    <MapPin size={20} className="text-accent shrink-0 mt-1" />
                    <div>
                      <p className="font-bold">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {center.address}, {center.city}
                      </p>
                    </div>
                  </div>
                  {center.phone && (
                    <div className="flex items-start gap-3 text-foreground">
                      <Phone size={20} className="text-accent shrink-0 mt-1" />
                      <div>
                        <p className="font-bold">Phone</p>
                        <p className="text-sm text-muted-foreground">
                          {center.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {center.email && (
                    <div className="flex items-start gap-3 text-foreground">
                      <Mail size={20} className="text-accent shrink-0 mt-1" />
                      <div>
                        <p className="font-bold">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {center.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {center.website && (
                    <div className="flex items-start gap-3 text-foreground">
                      <Globe size={20} className="text-accent shrink-0 mt-1" />
                      <div>
                        <p className="font-bold">Website</p>
                        <a
                          href={center.website}
                          target="_blank"
                          className="text-sm text-accent hover:underline"
                        >
                          {center.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Doctors in this center */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Users size={20} />
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Medical Staff
            </h2>
          </div>

          {doctors.length === 0 ? (
            <GlassPanel className="py-12 text-center border-dashed">
              <p className="text-muted-foreground">
                No doctors are currently listed for this center.
              </p>
            </GlassPanel>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doc) => (
                <Link key={doc.publicId} href={`/doctors/${doc.publicId}`}>
                  <GlassCard className="p-6 flex flex-col items-center text-center">
                    <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-2xl font-black text-primary-foreground mb-4 shadow-inner">
                      {doc.firstName[0]}
                      {doc.lastName[0]}
                    </div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">
                      Dr. {doc.firstName} {doc.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {doc.specializations.join(", ") || "General Practitioner"}
                    </p>
                    <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 w-full flex justify-center">
                      <span className="text-xs font-bold text-accent">
                        View Profile
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
