import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Calendar, CheckCircle, Building2, Stethoscope, ArrowRight } from "lucide-react";
import { getServerSession } from "@/lib/server/session";
import { HeroSearch } from "@/components/landing/hero-search";

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ isAuth }: { isAuth: boolean }) {
  return (
    <nav className="absolute top-0 left-0 right-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#36A372]">
            <span className="text-sm font-black text-white">CB</span>
          </div>
          <span className="text-lg font-bold text-white">ClearBook</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/centers"
            className="hidden sm:block text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Centers
          </Link>
          {isAuth ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#36A372] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#297A56]"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth"
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="rounded-lg bg-[#36A372] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#297A56]"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#080F20] to-[#102240] pb-24 pt-32">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#36A372]/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 top-1/4 h-64 w-64 rounded-full bg-[#F0EBE9]/5 blur-3xl" />
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#36A372]/30 bg-[#36A372]/10 px-4 py-1.5 text-xs font-medium text-[#36A372]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#36A372]" />
          Trusted by doctors and patients
        </span>

        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Find a Doctor and Book an
          <span className="text-[#36A372]"> Appointment</span> in 3 Minutes
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65">
          ClearBook connects patients with verified medical professionals. Browse
          by specialization, choose your clinic, and secure your appointment — all
          in one place.
        </p>

        {/* Search card */}
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white/5 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
          <HeroSearch />
        </div>

        {/* Stats */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-white/50">
          {[
            { n: "200+", label: "Verified Doctors" },
            { n: "50+", label: "Medical Centers" },
            { n: "10k+", label: "Appointments Booked" },
          ].map(({ n, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-white">{n}</p>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: Search,
    title: "Search for a Doctor",
    description:
      "Browse our directory of verified specialists. Filter by specialization and city to find the right doctor for you.",
  },
  {
    icon: Calendar,
    title: "Choose a Time Slot",
    description:
      "View the doctor's availability and select a date and time that works for your schedule.",
  },
  {
    icon: CheckCircle,
    title: "Confirm & Attend",
    description:
      "Receive instant confirmation. Show up at the clinic at the scheduled time — it's that simple.",
  },
];

function HowItWorks() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Book your appointment in three easy steps.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="relative text-center">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute left-[calc(50%+2.5rem)] top-7 hidden h-px w-[calc(100%-5rem+2rem)] bg-border sm:block" />
              )}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                <Icon size={24} className="text-accent" />
              </div>
              <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── B2B Section ──────────────────────────────────────────────────────────────

function B2BSection() {
  return (
    <section className="bg-secondary/60 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            For Healthcare Professionals
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Are you a doctor or clinic manager?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            ClearBook helps you reach more patients, manage your schedule
            efficiently, and grow your practice — all in one platform.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* For doctors */}
          <div className="rounded-2xl border border-border bg-card p-7">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Stethoscope size={20} className="text-primary" />
            </div>
            <h3 className="mb-2 font-bold text-foreground">For Doctors</h3>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              Create your public profile, define your availability, and get
              discovered by patients in your area. Join one or more medical
              centers with a simple invite code.
            </p>
            <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
              {[
                "Verified professional profile",
                "Flexible schedule management",
                "Multi-center affiliation",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle size={14} className="shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              Join as a Doctor <ArrowRight size={14} />
            </Link>
          </div>

          {/* For clinics */}
          <div className="rounded-2xl border border-border bg-card p-7">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Building2 size={20} className="text-primary" />
            </div>
            <h3 className="mb-2 font-bold text-foreground">For Medical Centers</h3>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              Register your clinic or hospital, manage your team of doctors,
              and let patients find and book appointments at your facility.
            </p>
            <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
              {[
                "Public center profile & listing",
                "Invite doctors via unique codes",
                "Resource management",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle size={14} className="shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              Register a Center <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#102240]">
            <span className="text-[10px] font-black text-[#36A372]">CB</span>
          </div>
          <span className="text-sm font-semibold text-foreground">ClearBook</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ClearBook. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const session = await getServerSession();

  // Authenticated users who explicitly visit / → dashboard
  // (but stay on landing if they come for other reasons)
  // We allow staying on landing for now, navbar shows "Go to Dashboard"

  return (
    <div className="min-h-screen">
      <Navbar isAuth={!!session} />
      <Hero />
      <HowItWorks />
      <B2BSection />
      <Footer />
    </div>
  );
}
