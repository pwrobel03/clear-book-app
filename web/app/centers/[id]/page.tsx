import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";

import {
  getCenterByIdAction,
  getCenterMembersAction,
} from "@/lib/actions/centers";
import { getSpecializationsAction } from "@/lib/actions/doctor";
import { TYPE_LABELS } from "@/lib/constants/labels";

// TODO: This page is the public profile of a medical center. It shows basic information about the center (name, address, contact info) and a list of doctors working there. It's accessible to everyone, even non-authenticated users. We will add more information to it in the future (like opening hours, services offered, etc.) but for now it's just a simple profile page with basic info and doctors list.

// TODO: We should also add a "Book an appointment" CTA to this page, but we will implement the booking flow in the future, so for now it's just a placeholder link that leads to the auth page (since only authenticated users will be able to book appointments).

// TODO: We should also add some kind of notification system to notify doctor when they receive a new invitation, but for now they will have to check the "My Centers" page manually to see if they received any new invitations.

// TODO: We should also add some kind of "Share this center" functionality to this page (like sharing the center profile link on social media, etc.) but we will implement that in the future, so for now it's just a simple page without any sharing features.

// TODO: We should also add some kind of "Write a review" functionality to this page, so users can share their experience with the center and help other users make informed decisions, but we will implement that in the future, so for now it's just a simple page without any review features.

// TODO: We should also add some kind of "View on map" functionality to this page, so users can see the location of the center on a map and get directions to it, but we will implement that in the future, so for now it's just a simple page without any map features.

export default async function CenterPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Równoległe pobieranie wszystkich potrzebnych danych
  const [center, members, specResult] = await Promise.all([
    getCenterByIdAction(id),
    getCenterMembersAction(id),
    getSpecializationsAction(),
  ]);

  // Weryfikacja: jeśli centrum nie istnieje lub nie jest aktywne -> 404
  if (!center || center.status !== "ACTIVE") notFound();

  // Budujemy słownik specjalizacji
  const specLabels: Record<string, string> = {};
  if (specResult.data) {
    specResult.data.forEach((s) => {
      specLabels[s.code] = s.name;
    });
  }

  // Wyłuskujemy tylko lekarzy (MEMBER) spośród wszystkich członków personelu
  const doctors = members.filter((m) => m.role === "MEMBER");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        {/* Header card */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2">
                <Badge variant="muted">
                  {TYPE_LABELS[center.type] ?? center.type}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {center.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <MapPin size={14} />
                {center.address}, {center.city}
              </p>
            </div>
            <Badge variant="accent">ACTIVE</Badge>
          </div>

          {center.description && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground border-t border-border pt-5">
              {center.description}
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold text-foreground">Contact</h2>
            <div className="space-y-3">
              {center.phone && (
                <a
                  href={`tel:${center.phone}`}
                  className="flex items-center gap-3 text-sm text-foreground hover:text-accent transition-colors"
                >
                  <Phone size={15} className="text-muted-foreground" />
                  {center.phone}
                </a>
              )}
              {center.email && (
                <a
                  href={`mailto:${center.email}`}
                  className="flex items-center gap-3 text-sm text-foreground hover:text-accent transition-colors"
                >
                  <Mail size={15} className="text-muted-foreground" />
                  {center.email}
                </a>
              )}
              {center.website && (
                <a
                  href={center.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-foreground hover:text-accent transition-colors"
                >
                  <Globe size={15} className="text-muted-foreground" />
                  {center.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {!center.phone && !center.email && !center.website && (
                <p className="text-sm text-muted-foreground">
                  No contact info provided.
                </p>
              )}
            </div>
          </div>

          {/* Doctors List */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold text-foreground">
              Our Doctors ({doctors.length})
            </h2>
            {doctors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No doctors listed yet.
              </p>
            ) : (
              <div className="space-y-3">
                {doctors.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {d.firstName[0]}
                      {d.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      {d.publicId ? (
                        <Link
                          href={`/doctors/${d.publicId}`}
                          className="block text-sm font-medium text-foreground hover:text-accent transition-colors"
                        >
                          Dr. {d.firstName} {d.lastName}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-foreground">
                          Dr. {d.firstName} {d.lastName}
                        </p>
                      )}
                      {d.specializations && d.specializations.length > 0 && (
                        <p className="truncate text-xs text-muted-foreground">
                          {d.specializations
                            .map((s) => specLabels[s] ?? s)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Book CTA */}
        <div className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 p-6">
          <div>
            <p className="font-semibold text-foreground">Book an appointment</p>
            <p className="text-sm text-muted-foreground">
              Sign in or create an account to book an appointment at{" "}
              {center.name}.
            </p>
          </div>
          <Link
            href="/auth"
            className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-dark transition-colors"
          >
            Get started
          </Link>
        </div>
      </main>
    </div>
  );
}
