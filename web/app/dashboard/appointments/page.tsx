"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isPast, isWithinInterval, addMinutes } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import {
  getMyAppointmentsAction,
  cancelAppointmentAction,
  type AppointmentResponse,
  type AppointmentStatus,
} from "@/lib/actions/booking";
import { DashboardHeader } from "@/components/dashboard/header";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  SCHEDULED: {
    label: "Scheduled",
    color: "text-blue-600 border-blue-500/40 bg-blue-500/10 dark:text-blue-400",
    icon: CheckCircle2,
  },
  RESERVED: {
    label: "Reserved (15 min)",
    color:
      "text-yellow-600 border-yellow-500/40 bg-yellow-500/10 dark:text-yellow-400",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    color:
      "text-green-600 border-green-500/40 bg-green-500/10 dark:text-green-400",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-500 border-red-400/40 bg-red-500/10 dark:text-red-400",
    icon: Ban,
  },
  NO_SHOW: {
    label: "No Show",
    color:
      "text-orange-500 border-orange-400/40 bg-orange-500/10 dark:text-orange-400",
    icon: AlertCircle,
  },
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "upcoming" | "past";

const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past & Cancelled" },
];

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  onCancel,
  cancelling,
}: {
  appointment: AppointmentResponse;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  const cfg = STATUS_CONFIG[appointment.status];
  const StatusIcon = cfg.icon;
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);

  const canCancel =
    appointment.status === "SCHEDULED" || appointment.status === "RESERVED";

  // Check if the RESERVED hold is about to expire (< 2 min left)
  const reservedUntil = appointment.reservedUntil
    ? new Date(appointment.reservedUntil)
    : null;
  const isExpiringSoon =
    appointment.status === "RESERVED" &&
    reservedUntil &&
    isWithinInterval(new Date(), {
      start: addMinutes(reservedUntil, -2),
      end: reservedUntil,
    });

  return (
    <GlassCard
      className={cn(
        "p-5 space-y-4 transition-all",
        appointment.status === "CANCELLED" && "opacity-60",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Stethoscope size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">
              {appointment.serviceName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dr. {appointment.doctorFirstName} {appointment.doctorLastName}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs shrink-0", cfg.color)}>
          <StatusIcon size={12} className="mr-1" />
          {cfg.label}
        </Badge>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={14} className="shrink-0 text-accent" />
          <span className="font-medium">
            {format(start, "EEE, MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock size={14} className="shrink-0 text-accent" />
          <span className="font-medium">
            {format(start, "HH:mm")} – {format(end, "HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
          <MapPin size={14} className="shrink-0 text-accent" />
          <span className="font-medium">{appointment.centerName}</span>
        </div>
      </div>

      {/* Patient notes */}
      {appointment.patientNotes && (
        <p className="text-xs text-muted-foreground bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 italic">
          "{appointment.patientNotes}"
        </p>
      )}

      {/* Reserved warning */}
      {appointment.status === "RESERVED" && reservedUntil && (
        <div
          className={cn(
            "flex items-center gap-2 text-xs font-medium rounded-xl px-3 py-2",
            isExpiringSoon
              ? "bg-red-500/10 text-red-500"
              : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
          )}
        >
          <AlertCircle size={14} />
          {isExpiringSoon
            ? "Hold expiring soon! Complete your booking."
            : `Reserved until ${format(reservedUntil, "HH:mm")} — your slot is temporarily held.`}
        </div>
      )}

      {/* Cancel button */}
      {canCancel && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl text-red-500 border-red-400/30 hover:bg-red-500/10 hover:text-red-600"
            disabled={cancelling}
            onClick={() => onCancel(appointment.id)}
          >
            {cancelling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
            Cancel Appointment
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);

    // For "upcoming" tab we fetch SCHEDULED and RESERVED separately, then merge + sort
    // Backend supports one status filter at a time, so we make 2 calls for upcoming
    if (activeTab === "upcoming") {
      const [scheduled, reserved] = await Promise.all([
        getMyAppointmentsAction({ status: "SCHEDULED", page: 0, size: 50 }),
        getMyAppointmentsAction({ status: "RESERVED", page: 0, size: 50 }),
      ]);

      const all: AppointmentResponse[] = [
        ...(scheduled.data?.content ?? []),
        ...(reserved.data?.content ?? []),
      ]
        .filter((a) => !isPast(new Date(a.endTime)))
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );

      setAppointments(all);
      setTotalPages(0); // client-side pagination not needed here
    } else {
      // Past: COMPLETED, CANCELLED, NO_SHOW — and past SCHEDULED
      const [completed, cancelled, noShow] = await Promise.all([
        getMyAppointmentsAction({ status: "COMPLETED", page, size: PAGE_SIZE }),
        getMyAppointmentsAction({ status: "CANCELLED", page, size: PAGE_SIZE }),
        getMyAppointmentsAction({ status: "NO_SHOW", page, size: PAGE_SIZE }),
      ]);

      const all: AppointmentResponse[] = [
        ...(completed.data?.content ?? []),
        ...(cancelled.data?.content ?? []),
        ...(noShow.data?.content ?? []),
      ].sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );

      setAppointments(all);
      setTotalPages(
        Math.max(
          completed.data?.totalPages ?? 0,
          cancelled.data?.totalPages ?? 0,
          noShow.data?.totalPages ?? 0,
        ),
      );
    }

    setIsLoading(false);
  }, [activeTab, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Reset page when switching tabs
  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    const result = await cancelAppointmentAction(id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Appointment cancelled successfully.");
      fetchAppointments();
    }
    setCancellingId(null);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Appointments" />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <PageHeader
              title="My Appointments"
              description="View and manage your upcoming and past visits."
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={fetchAppointments}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-white dark:bg-white/10 shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : appointments.length === 0 ? (
            <GlassPanel className="py-16 text-center border-dashed">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
                  <Calendar size={28} className="text-muted-foreground" />
                </div>
              </div>
              <p className="font-bold text-foreground">
                {activeTab === "upcoming"
                  ? "No upcoming appointments"
                  : "No past appointments yet"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeTab === "upcoming"
                  ? "Find a doctor and book your first appointment."
                  : "Your visit history will appear here."}
              </p>
              {activeTab === "upcoming" && (
                <a href="/doctors" className="mt-6 inline-block">
                  <Button className="rounded-2xl gap-2">
                    <Stethoscope size={16} />
                    Find a Doctor
                  </Button>
                </a>
              )}
            </GlassPanel>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onCancel={handleCancel}
                  cancelling={cancellingId === appt.id}
                />
              ))}
            </div>
          )}

          {/* Pagination (past tab only) */}
          {activeTab === "past" && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={page === 0 || isLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-bold text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
