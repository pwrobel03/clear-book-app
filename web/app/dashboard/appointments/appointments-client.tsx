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
  UserMinus,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard/header";
import { useRouter } from "next/navigation";
import {
  getMyAppointmentsAction,
  getDoctorAppointmentsListAction,
  cancelAppointmentAction,
  cancelByDoctorAction,
  markAsNoShowAction,
  type AppointmentResponse,
  type AppointmentStatus,
} from "@/lib/actions/booking";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  SCHEDULED: {
    label: "Scheduled",
    color: "text-blue-600 border-blue-500/40 bg-blue-500/10",
    icon: CheckCircle2,
  },
  RESERVED: {
    label: "Reserved (15 min)",
    color: "text-yellow-600 border-yellow-500/40 bg-yellow-500/10",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    color: "text-green-600 border-green-500/40 bg-green-500/10",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-500 border-red-400/40 bg-red-500/10",
    icon: Ban,
  },
  NO_SHOW: {
    label: "No Show",
    color: "text-orange-500 border-orange-400/40 bg-orange-500/10",
    icon: AlertCircle,
  },
};

type Tab = "upcoming" | "past";
const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past & Cancelled" },
];

function AppointmentCard({
  appointment,
  onCancel,
  onNoShow,
  cancelling,
  isDoctor,
}: {
  appointment: AppointmentResponse;
  onCancel: (id: string) => void;
  onNoShow: (id: string) => void;
  cancelling: boolean;
  isDoctor: boolean;
}) {
  const cfg = STATUS_CONFIG[appointment.status];
  const StatusIcon = cfg.icon;
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);

  const canCancel =
    appointment.status === "SCHEDULED" ||
    (!isDoctor && appointment.status === "RESERVED");
  const canNoShow = isDoctor && appointment.status === "SCHEDULED";

  const reservedUntil = appointment.reservedUntil
    ? new Date(appointment.reservedUntil)
    : null;
  const isExpiringSoon =
    !isDoctor &&
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {isDoctor ? (
              <User size={18} className="text-primary" />
            ) : (
              <Stethoscope size={18} className="text-primary" />
            )}
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">
              {appointment.serviceName}
            </p>
            {isDoctor ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Patient:{" "}
                {appointment.patientFirstName
                  ? `${appointment.patientFirstName} ${appointment.patientLastName}`
                  : appointment.patientId.substring(0, 8)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Dr. {appointment.doctorFirstName} {appointment.doctorLastName}
              </p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs shrink-0", cfg.color)}>
          <StatusIcon size={12} className="mr-1" />
          {cfg.label}
        </Badge>
      </div>

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

      {/* {appointment.patientNotes && (
        <p className="text-xs text-muted-foreground bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 italic">
          "{appointment.patientNotes}"
        </p>
      )} */}

      {appointment.status === "RESERVED" && reservedUntil && !isDoctor && (
        <div
          className={cn(
            "flex items-center gap-2 text-xs font-medium rounded-xl px-3 py-2",
            isExpiringSoon
              ? "bg-red-500/10 text-red-500"
              : "bg-yellow-500/10 text-yellow-600",
          )}
        >
          <AlertCircle size={14} />
          {isExpiringSoon
            ? "Hold expiring soon! Complete your booking."
            : `Reserved until ${format(reservedUntil, "HH:mm")}`}
        </div>
      )}

      {(canCancel || canNoShow) && (
        <div className="pt-1 flex gap-2">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-red-500 border-red-400/30 hover:bg-red-500/10"
              disabled={cancelling}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCancel(appointment.id);
              }}
            >
              {cancelling ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}{" "}
              Cancel
            </Button>
          )}
          {canNoShow && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-orange-500 border-orange-400/30 hover:bg-orange-500/10"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onNoShow(appointment.id);
              }}
            >
              <UserMinus size={14} /> No Show
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  );
}

const PAGE_SIZE = 10;

export function AppointmentsClient({ userRole }: { userRole: string }) {
  const router = useRouter();
  const isDoctor = userRole === "DOCTOR";

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);

    // Decydujemy, której akcji użyć na podstawie roli
    const fetchAction = isDoctor
      ? getDoctorAppointmentsListAction
      : getMyAppointmentsAction;

    if (activeTab === "upcoming") {
      // Pobieramy SCHEDULED, a dla pacjenta także RESERVED
      const promises = [
        fetchAction({
          status: "SCHEDULED",
          page: 0,
          size: 50,
          sort: "startTime,asc",
        }),
      ];
      if (!isDoctor)
        promises.push(fetchAction({ status: "RESERVED", page: 0, size: 50 }));

      const results = await Promise.all(promises);
      const all: AppointmentResponse[] = results
        .flatMap((r) => r.data?.content ?? [])
        .filter((a) => !isPast(new Date(a.endTime)))
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );

      setAppointments(all);
      setTotalPages(0);
    } else {
      const [completed, cancelled, noShow] = await Promise.all([
        fetchAction({
          status: "COMPLETED",
          page,
          size: PAGE_SIZE,
          sort: "startTime,desc",
        }),
        fetchAction({
          status: "CANCELLED",
          page,
          size: PAGE_SIZE,
          sort: "startTime,desc",
        }),
        fetchAction({
          status: "NO_SHOW",
          page,
          size: PAGE_SIZE,
          sort: "startTime,desc",
        }),
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
  }, [activeTab, page, isDoctor]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  const handleCancel = async (id: string) => {
    setActionId(id);
    let result;
    if (isDoctor) {
      const reason = prompt("Please provide a reason for cancellation:");
      if (!reason) {
        setActionId(null);
        return;
      }
      result = await cancelByDoctorAction(id, reason);
    } else {
      result = await cancelAppointmentAction(id);
    }

    if (result.error) toast.error(result.error);
    else {
      toast.success("Appointment cancelled.");
      fetchAppointments();
    }
    setActionId(null);
  };

  const handleNoShow = async (id: string) => {
    if (!confirm("Mark this appointment as a no-show?")) return;
    setActionId(id);
    const result = await markAsNoShowAction(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Marked as no-show.");
      fetchAppointments();
    }
    setActionId(null);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader
        title={isDoctor ? "Patient Appointments" : "Appointments"}
      />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <PageHeader
              title={isDoctor ? "Schedule Overview" : "My Appointments"}
              description={
                isDoctor
                  ? "Manage your scheduled visits and patient flow."
                  : "View and manage your upcoming and past visits."
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={fetchAppointments}
              disabled={isLoading}
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
            </Button>
          </div>

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
                  : "No past appointments"}
              </p>
            </GlassPanel>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={() =>
                    router.push(`/dashboard/appointments/${appointment.id}`)
                  }
                  className="cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <AppointmentCard
                    appointment={appointment}
                    onCancel={handleCancel}
                    onNoShow={handleNoShow}
                    cancelling={actionId === appointment.id}
                    isDoctor={isDoctor}
                  />
                </div>
              ))}
            </div>
          )}

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
              <span className="text-sm font-bold">
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
