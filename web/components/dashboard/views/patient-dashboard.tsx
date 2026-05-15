"use client";

import { useState, useEffect } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import {
  Calendar,
  Stethoscope,
  Clock,
  ArrowRight,
  Loader2,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { SessionUser } from "@/types/session";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { PageHeader } from "../page-header";
import {
  getMyAppointmentsAction,
  type AppointmentResponse,
} from "@/lib/actions/booking";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatApptDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return `Today · ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, "HH:mm")}`;
  return format(d, "EEE, d MMM · HH:mm");
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  loading,
  iconColor = "bg-accent/15 dark:bg-accent/20 text-accent dark:text-accent-light",
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number;
  sub?: string;
  loading?: boolean;
  iconColor?: string;
}) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${iconColor}`}>
          <Icon size={22} />
        </div>
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <div className="mt-5 h-10 w-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
      ) : (
        <>
          <p className="mt-5 text-4xl font-black text-foreground">{value ?? "—"}</p>
          {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
        </>
      )}
    </GlassCard>
  );
}

// ── Upcoming appointment row ───────────────────────────────────────────────────

function UpcomingRow({ appt }: { appt: AppointmentResponse }) {
  const isReserved = appt.status === "RESERVED";

  return (
    <Link
      href={`/dashboard/appointments/${appt.id}`}
      className="flex items-center gap-4 py-3.5 border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-xl px-2 -mx-2 transition-colors group"
    >
      {/* Avatar / icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isReserved ? "bg-amber-500/10" : "bg-primary/10"}`}>
        <Stethoscope size={16} className={isReserved ? "text-amber-600 dark:text-amber-400" : "text-primary"} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate">
            {appt.serviceName}
          </p>
          {isReserved && (
            <Badge variant="warning" className="text-[10px] px-2 py-0 h-5 shrink-0">
              Needs confirmation
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          Dr. {appt.doctorFirstName} {appt.doctorLastName}
          {" · "}
          <span className="inline-flex items-center gap-1">
            <MapPin size={10} className="shrink-0" />
            {appt.centerName}
          </span>
        </p>
      </div>

      {/* Date */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isReserved ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
          {formatApptDate(appt.startTime)}
        </p>
      </div>

      {/* Arrow */}
      <ArrowRight
        size={14}
        className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
      />
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PatientDashboard({ user }: { user: SessionUser }) {
  const [isLoading, setIsLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<AppointmentResponse[]>([]);
  const [lastVisit, setLastVisit] = useState<AppointmentResponse | null>(null);
  const [totalUpcoming, setTotalUpcoming] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => {
    async function load() {
      setIsLoading(true);

      const [scheduledRes, reservedRes, completedRes] = await Promise.all([
        getMyAppointmentsAction({ status: "SCHEDULED", page: 0, size: 10, sort: "startTime,asc" }),
        getMyAppointmentsAction({ status: "RESERVED",  page: 0, size: 5,  sort: "startTime,asc" }),
        getMyAppointmentsAction({ status: "COMPLETED", page: 0, size: 1,  sort: "startTime,desc" }),
      ]);

      // Merge and sort upcoming (RESERVED + SCHEDULED)
      const merged = [
        ...(reservedRes.data?.content ?? []),
        ...(scheduledRes.data?.content ?? []),
      ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      setUpcoming(merged);
      setTotalUpcoming(
        (scheduledRes.data?.totalElements ?? 0) +
        (reservedRes.data?.totalElements ?? 0)
      );

      const completedContent = completedRes.data?.content ?? [];
      setLastVisit(completedContent[0] ?? null);
      setTotalCompleted(completedRes.data?.totalElements ?? 0);

      setIsLoading(false);
    }
    load();
  }, []);

  // Show up to 5 rows in the dashboard list
  const visibleUpcoming = upcoming.slice(0, 5);
  const hiddenCount = totalUpcoming - visibleUpcoming.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto relative z-10">
        <PageHeader
          title={`Good to see you, ${user.firstName}`}
          description="Manage your appointments and find the right doctor for you."
        />

        <div className="space-y-8 max-w-5xl mx-auto">

          {/* ── KPI row ──────────────────────────────────────────────── */}
          <div className="grid gap-6 sm:grid-cols-3">
            <StatCard
              icon={Calendar}
              label="Upcoming"
              value={isLoading ? undefined : totalUpcoming}
              sub={
                !isLoading
                  ? totalUpcoming === 0
                    ? "No upcoming appointments"
                    : totalUpcoming === 1
                      ? "1 appointment scheduled"
                      : `${totalUpcoming} appointments scheduled`
                  : undefined
              }
              loading={isLoading}
            />

            <StatCard
              icon={CheckCircle2}
              label="Completed visits"
              value={isLoading ? undefined : totalCompleted}
              sub={
                !isLoading
                  ? totalCompleted === 0
                    ? "No visit history yet"
                    : `${totalCompleted} visit${totalCompleted !== 1 ? "s" : ""} in total`
                  : undefined
              }
              loading={isLoading}
              iconColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />

            {/* Find a doctor — always visible CTA */}
            <Link href="/doctors">
              <GlassCard className="group flex h-full cursor-pointer items-center justify-between p-6 hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner transition-transform group-hover:rotate-6">
                    <Search size={22} className="text-accent dark:text-accent-light" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Find a Doctor</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">Book an appointment</p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-accent opacity-50 transition-all group-hover:opacity-100 group-hover:translate-x-1"
                />
              </GlassCard>
            </Link>
          </div>

          {/* ── Upcoming appointments ─────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">Upcoming Appointments</h2>
              {totalUpcoming > 0 && (
                <Link href="/dashboard/appointments">
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5">
                    All appointments <ArrowRight size={13} />
                  </button>
                </Link>
              )}
            </div>

            <GlassPanel className="px-4 py-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-muted-foreground" />
                </div>
              ) : visibleUpcoming.length === 0 ? (
                /* Empty state */
                <div className="py-10 text-center">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-accent/10 mb-4">
                    <Calendar size={26} className="text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No upcoming appointments</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-5">
                    Ready to book? Find a doctor and schedule your visit.
                  </p>
                  <Link
                    href="/doctors"
                    className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline underline-offset-4"
                  >
                    <Search size={14} /> Browse doctors
                  </Link>
                </div>
              ) : (
                <>
                  {visibleUpcoming.map((appt) => (
                    <UpcomingRow key={appt.id} appt={appt} />
                  ))}

                  {/* "X more" footer */}
                  {hiddenCount > 0 && (
                    <Link
                      href="/dashboard/appointments"
                      className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors border-t border-black/5 dark:border-white/5 mt-1"
                    >
                      +{hiddenCount} more appointment{hiddenCount !== 1 ? "s" : ""}
                      <ArrowRight size={12} />
                    </Link>
                  )}
                </>
              )}
            </GlassPanel>
          </div>

          {/* ── Last completed visit ──────────────────────────────────── */}
          {!isLoading && lastVisit && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">Last Visit</h2>
              <Link href={`/dashboard/appointments/${lastVisit.id}`}>
                <GlassCard className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-emerald-500/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                      <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{lastVisit.serviceName}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Dr. {lastVisit.doctorFirstName} {lastVisit.doctorLastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:text-right shrink-0">
                    <span className="font-semibold text-foreground">
                      {format(new Date(lastVisit.startTime), "d MMM yyyy")}
                    </span>
                    <span className="flex items-center gap-1 sm:justify-end text-xs">
                      <MapPin size={11} /> {lastVisit.centerName}
                    </span>
                  </div>
                  <ArrowRight
                    size={15}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 hidden sm:block"
                  />
                </GlassCard>
              </Link>
            </div>
          )}

          {/* ── Quick actions ─────────────────────────────────────────── */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-3">

              <Link href="/doctors">
                <GlassCard className="group flex items-center justify-between p-5 cursor-pointer hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:rotate-6">
                      <Stethoscope size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Find a Doctor</p>
                      <p className="text-xs text-muted-foreground">Search by specialty</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </GlassCard>
              </Link>

              <Link href="/dashboard/appointments">
                <GlassCard className="group flex items-center justify-between p-5 cursor-pointer hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-transform group-hover:rotate-6">
                      <Clock size={18} className="text-accent dark:text-accent-light" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">All Appointments</p>
                      <p className="text-xs text-muted-foreground">History & upcoming</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </GlassCard>
              </Link>

              <Link href="/centers">
                <GlassCard className="group flex items-center justify-between p-5 cursor-pointer hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 transition-transform group-hover:rotate-6">
                      <Building2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Medical Centers</p>
                      <p className="text-xs text-muted-foreground">Browse near you</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </GlassCard>
              </Link>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
