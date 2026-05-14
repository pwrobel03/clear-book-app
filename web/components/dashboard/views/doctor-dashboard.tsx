"use client";

import { useState, useEffect } from "react";
import { format, isToday } from "date-fns";
import {
  Calendar,
  Building2,
  Key,
  RefreshCw,
  Copy,
  Check,
  Clock,
  CalendarCheck2,
  Banknote,
  ArrowRight,
  Stethoscope,
  MapPin,
  BarChart2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/types/session";
import {
  getInviteCodeAction,
  refreshInviteCodeAction,
} from "@/lib/actions/doctor";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { PageHeader } from "../page-header";
import {
  getDoctorAppointmentsListAction,
  type AppointmentResponse,
} from "@/lib/actions/booking";
import { getMyCentersAction } from "@/lib/actions/centers";
import { getMonthlyReportAction, type MonthlyReport } from "@/lib/actions/reports";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Invite code card ──────────────────────────────────────────────────────────

function InviteCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchCode() {
    setLoading(true);
    const result = await getInviteCodeAction();
    if (result.data) {
      setCode(result.data.code);
      setExpiresAt(result.data.expiresAt);
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    const result = await refreshInviteCodeAction();
    if (result.data) {
      setCode(result.data.code);
      setExpiresAt(result.data.expiresAt);
    }
    setRefreshing(false);
  }

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => { fetchCode(); }, []);

  const expiryLabel = expiresAt
    ? `Expires ${new Date(expiresAt).toLocaleString("en-GB", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      })}`
    : null;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner transition-transform group-hover:scale-110">
          <Key size={22} className="text-accent dark:text-accent-light" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground">Invite Code</span>
      </div>
      <div className="mt-5">
        {loading ? (
          <div className="h-10 w-48 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
        ) : (
          <p className="font-mono text-3xl font-black tracking-widest text-foreground">
            {code ?? "—"}
          </p>
        )}
        {expiryLabel && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock size={14} /> {expiryLabel}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Share this code so a medical center can invite you.
      </p>
      <div className="mt-5 flex gap-3">
        <Button size="sm" onClick={handleCopy} disabled={!code || loading} className="gap-2 rounded-xl">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleRefresh} disabled={refreshing || loading}
          className="gap-2 rounded-xl bg-secondary/50 backdrop-blur-sm hover:bg-secondary">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
    </GlassCard>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

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
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110 ${iconColor}`}>
          <Icon size={22} />
        </div>
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <div className="mt-5 h-10 w-20 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
      ) : (
        <>
          <p className="mt-5 text-4xl font-black text-foreground">{value ?? "—"}</p>
          {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
        </>
      )}
    </GlassCard>
  );
}

// ── Today's appointment row ────────────────────────────────────────────────────

function TodayAppointmentRow({ appt }: { appt: AppointmentResponse }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-black/5 dark:border-white/5 last:border-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Stethoscope size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {appt.patientFirstName
            ? `${appt.patientFirstName} ${appt.patientLastName}`
            : "Patient"}
        </p>
        <p className="text-xs text-muted-foreground truncate">{appt.serviceName}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">
          {format(new Date(appt.startTime), "HH:mm")}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
          <MapPin size={10} /> {appt.centerName}
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DoctorDashboard({ user }: { user: SessionUser }) {
  const today = new Date();
  const [dataLoading, setDataLoading] = useState(true);
  const [todayAppts, setTodayAppts] = useState<AppointmentResponse[]>([]);
  const [activeCenters, setActiveCenters] = useState<number | null>(null);
  const [monthReport, setMonthReport] = useState<MonthlyReport | null>(null);

  useEffect(() => {
    async function loadAll() {
      setDataLoading(true);

      const [apptResult, centersResult, reportResult] = await Promise.all([
        getDoctorAppointmentsListAction({ status: "SCHEDULED", size: 50 }),
        getMyCentersAction(),
        getMonthlyReportAction(today.getFullYear(), today.getMonth() + 1),
      ]);

      // Filter for today
      const all = apptResult.data?.content ?? [];
      setTodayAppts(
        all
          .filter((a) => isToday(new Date(a.startTime)))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      );

      const centers = centersResult.data ?? [];
      setActiveCenters(centers.filter((c) => c.status === "ACTIVE").length);

      setMonthReport(reportResult.data ?? null);
      setDataLoading(false);
    }
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthName = today.toLocaleString("en-GB", { month: "long" });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto relative z-10">
        <PageHeader
          title={`Welcome, Dr. ${user.lastName}`}
          description="Here's your practice at a glance."
        />

        <div className="space-y-8 max-w-5xl mx-auto">

          {/* ── KPI row ────────────────────────────────────────────────── */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Today's appointments */}
            <StatCard
              icon={Calendar}
              label="Today"
              value={dataLoading ? undefined : `${todayAppts.length}`}
              sub={
                !dataLoading
                  ? todayAppts.length === 0
                    ? "No appointments today"
                    : todayAppts.length === 1
                      ? "1 appointment"
                      : `${todayAppts.length} appointments`
                  : undefined
              }
              loading={dataLoading}
            />

            {/* This month completed */}
            <StatCard
              icon={CalendarCheck2}
              label={`${monthName} completed`}
              value={dataLoading ? undefined : monthReport?.completed ?? 0}
              sub={
                !dataLoading && monthReport
                  ? `${monthReport.totalAppointments} total this month`
                  : undefined
              }
              loading={dataLoading}
              iconColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />

            {/* This month earnings */}
            <StatCard
              icon={Banknote}
              label={`${monthName} earnings`}
              value={
                !dataLoading && monthReport
                  ? formatCurrency(monthReport.totalEarnings)
                  : undefined
              }
              sub="from completed visits"
              loading={dataLoading}
              iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />

            {/* Active centers */}
            <StatCard
              icon={Building2}
              label="Active Centers"
              value={dataLoading ? undefined : activeCenters ?? 0}
              sub={
                !dataLoading
                  ? activeCenters === 0
                    ? "Join a center to start"
                    : `${activeCenters} affiliated`
                  : undefined
              }
              loading={dataLoading}
            />
          </div>

          {/* ── Today's schedule ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">
                Today&apos;s Schedule
              </h2>
              <Link href="/dashboard/appointments">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs rounded-xl">
                  All appointments <ArrowRight size={14} />
                </Button>
              </Link>
            </div>

            <GlassPanel className="px-6 py-2">
              {dataLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-muted-foreground" />
                </div>
              ) : todayAppts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-semibold text-foreground">No appointments today</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enjoy the free time — or{" "}
                    <Link href="/dashboard/schedule" className="text-primary underline-offset-4 hover:underline">
                      add a working block
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                todayAppts.map((a) => (
                  <TodayAppointmentRow key={a.id} appt={a} />
                ))
              )}
            </GlassPanel>
          </div>

          {/* ── Quick actions ─────────────────────────────────────────── */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Link href="/dashboard/schedule">
                <GlassCard className="group flex items-center justify-between p-5 cursor-pointer hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:rotate-6">
                      <Calendar size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">My Schedule</p>
                      <p className="text-xs text-muted-foreground">Manage availability</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </GlassCard>
              </Link>

              <Link href="/dashboard/reports">
                <GlassCard className="group flex items-center justify-between p-5 cursor-pointer hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 transition-transform group-hover:rotate-6">
                      <BarChart2 size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Reports</p>
                      <p className="text-xs text-muted-foreground">Monthly statistics</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </GlassCard>
              </Link>

              <Link href="/dashboard/services">
                <GlassCard className="group flex items-center justify-between p-5 cursor-pointer hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 transition-transform group-hover:rotate-6">
                      <Stethoscope size={18} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Services</p>
                      <p className="text-xs text-muted-foreground">Manage your offer</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </GlassCard>
              </Link>
            </div>
          </div>

          {/* ── Invite code ───────────────────────────────────────────── */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <InviteCodeCard />
          </div>

        </div>
      </main>
    </div>
  );
}
