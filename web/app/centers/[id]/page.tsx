import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, Stethoscope, ShieldCheck } from "lucide-react";
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
  website: string | null;
  logoUrl: string | null;
  type: string;
  status: string;
  createdAt: string;
};

type Member = {
  firstName: string;
  lastName: string;
  publicId: string | null;
  specializations: string[];
  role: "MEMBER" | "ADMIN";
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  CLINIC: "Clinic",
  HOSPITAL: "Hospital",
  PRIVATE_PRACTICE: "Private Practice",
  DIAGNOSTIC_CENTER: "Diagnostic Center",
  REHABILITATION_CENTER: "Rehabilitation Center",
};

const SPEC_LABELS: Record<string, string> = {
  CARDIOLOGY: "Cardiology", NEUROLOGY: "Neurology", ORTHOPEDICS: "Orthopedics",
  PEDIATRICS: "Pediatrics", DERMATOLOGY: "Dermatology", GYNECOLOGY: "Gynecology",
  PSYCHIATRY: "Psychiatry", OPHTHALMOLOGY: "Ophthalmology", RADIOLOGY: "Radiology",
  ONCOLOGY: "Oncology", EMERGENCY_MEDICINE: "Emergency Medicine",
  INTERNAL_MEDICINE: "Internal Medicine", SURGERY: "Surgery", UROLOGY: "Urology",
  ENDOCRINOLOGY: "Endocrinology", GASTROENTEROLOGY: "Gastroenterology",
  PULMONOLOGY: "Pulmonology", RHEUMATOLOGY: "Rheumatology",
  NEPHROLOGY: "Nephrology", HEMATOLOGY: "Hematology",
  ANESTHESIOLOGY: "Anesthesiology", FAMILY_MEDICINE: "Family Medicine",
};

// ─── Minimal header ───────────────────────────────────────────────────────────

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
        <Link href="/auth" className="text-sm font-medium text-accent hover:underline">
          Sign in
        </Link>
      </div>
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CenterPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [centerRes, membersRes] = await Promise.all([
    fetch(`${SPRING}/api/centers/${id}`, { cache: "no-store" }),
    fetch(`${SPRING}/api/centers/${id}/members`, { cache: "no-store" }),
  ]);

  if (!centerRes.ok) notFound();
  if (centerRes.ok && (await centerRes.clone().json()).status !== "ACTIVE") notFound();

  const center: MedicalCenter = await centerRes.json();
  const members: Member[] = membersRes.ok ? await membersRes.json() : [];

  const doctors = members.filter((m) => m.role === "MEMBER");

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-6 py-12 space-y-8">

        {/* Header card */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2">
                <Badge variant="muted">{TYPE_LABELS[center.type] ?? center.type}</Badge>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{center.name}</h1>
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
          {/* Contact */}
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
                <p className="text-sm text-muted-foreground">No contact info provided.</p>
              )}
            </div>
          </div>

          {/* Doctors */}
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
                      {d.firstName[0]}{d.lastName[0]}
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
                            .map((s) => SPEC_LABELS[s] ?? s)
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
              Sign in or create an account to book an appointment at {center.name}.
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
