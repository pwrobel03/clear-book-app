"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CalendarCheck2,
  XCircle,
  UserX,
  Clock,
  Building2,
  Stethoscope,
  Banknote,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass";
import {
  getMonthlyReportAction,
  type MonthlyReport,
} from "@/lib/actions/reports";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(value);
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <GlassPanel className="p-5 flex items-start gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner ${color}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-black text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </GlassPanel>
  );
}

// ── Completion bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-muted-foreground w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReportsClient() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const result = await getMonthlyReportAction(y, m);
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setReport(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReport(year, month);
  }, [year, month, fetchReport]);

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const isCurrentMonth =
      year === today.getFullYear() && month === today.getMonth() + 1;
    if (isCurrentMonth) return; // can't go into the future
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  }

  const isCurrent =
    year === today.getFullYear() && month === today.getMonth() + 1;

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <GlassPanel className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={prevMonth}
          disabled={loading}
        >
          <ChevronLeft size={18} />
        </Button>

        <div className="text-center">
          <p className="text-xl font-black text-foreground">
            {MONTH_NAMES[month - 1]} {year}
          </p>
          {isCurrent && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Current month
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={nextMonth}
          disabled={loading || isCurrent}
        >
          <ChevronRight size={18} />
        </Button>
      </GlassPanel>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {/* No data */}
      {!loading && report && report.totalAppointments === 0 && (
        <GlassPanel className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/50 mx-auto mb-4">
            <CalendarCheck2 size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No appointments</h3>
          <p className="text-sm text-muted-foreground mt-1">
            There were no appointments in {MONTH_NAMES[month - 1]} {year}.
          </p>
        </GlassPanel>
      )}

      {/* Stats */}
      {!loading && report && report.totalAppointments > 0 && (
        <>
          {/* Top KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={TrendingUp}
              label="Total"
              value={report.totalAppointments}
              color="bg-primary/10 text-primary"
            />
            <StatCard
              icon={CalendarCheck2}
              label="Completed"
              value={report.completed}
              sub={`${report.totalAppointments > 0 ? Math.round((report.completed / report.totalAppointments) * 100) : 0}% completion rate`}
              color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={Banknote}
              label="Earnings"
              value={formatCurrency(report.totalEarnings)}
              sub="from completed visits"
              color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              icon={XCircle}
              label="Cancelled"
              value={report.cancelled}
              color="bg-destructive/10 text-destructive"
            />
          </div>

          {/* Secondary row */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={Clock}
              label="Scheduled"
              value={report.scheduled}
              sub="upcoming in this period"
              color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              icon={UserX}
              label="No-shows"
              value={report.noShow}
              color="bg-orange-500/10 text-orange-600 dark:text-orange-400"
            />
          </div>

          {/* Status breakdown */}
          <GlassPanel className="p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Appointment breakdown
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "Completed",
                  count: report.completed,
                  color: "bg-emerald-500",
                },
                {
                  label: "Cancelled",
                  count: report.cancelled,
                  color: "bg-destructive",
                },
                {
                  label: "No-show",
                  count: report.noShow,
                  color: "bg-orange-500",
                },
                {
                  label: "Scheduled",
                  count: report.scheduled,
                  color: "bg-blue-500",
                },
              ].map(({ label, count, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{label}</span>
                    <span className="text-muted-foreground font-semibold">
                      {count}
                    </span>
                  </div>
                  <ProgressBar
                    value={count}
                    max={report.totalAppointments}
                    color={color}
                  />
                </div>
              ))}
            </div>
          </GlassPanel>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top services */}
            {report.topServices.length > 0 && (
              <GlassPanel className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Stethoscope size={16} className="text-muted-foreground" />
                  <h3 className="text-base font-bold text-foreground">
                    Top services
                  </h3>
                </div>
                <div className="space-y-3">
                  {report.topServices.map((s, i) => (
                    <div
                      key={s.serviceName}
                      className="flex items-center gap-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">
                        {s.serviceName}
                      </span>
                      <span className="text-sm font-bold text-muted-foreground">
                        {s.count}×
                      </span>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )}

            {/* Per-center */}
            {report.perCenter.length > 0 && (
              <GlassPanel className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-muted-foreground" />
                  <h3 className="text-base font-bold text-foreground">
                    By center
                  </h3>
                </div>
                <div className="space-y-4">
                  {report.perCenter.map((c) => (
                    <div key={c.centerName} className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-foreground truncate max-w-[60%]">
                          {c.centerName}
                        </span>
                        <span className="text-xs text-muted-foreground font-bold">
                          {c.total} visits · {formatCurrency(c.earnings)}
                        </span>
                      </div>
                      <ProgressBar
                        value={c.completed}
                        max={c.total}
                        color="bg-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )}
          </div>
        </>
      )}
    </div>
  );
}
