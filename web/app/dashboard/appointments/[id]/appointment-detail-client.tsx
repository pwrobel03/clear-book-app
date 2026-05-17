"use client";

import { useState, useEffect } from "react";
import { format, differenceInSeconds } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  ArrowLeft,
  AlertCircle,
  Building2,
  User,
  FileText,
  Ban,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassPanel, GlassCard } from "@/components/ui/glass";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  confirmAppointmentAction,
  cancelByDoctorAction,
  markAsNoShowAction,
  type AppointmentResponse,
} from "@/lib/actions/booking";

interface AppointmentDetailProps {
  appointment: AppointmentResponse;
  userRole: string; // "USER" lub "DOCTOR"
}

export function AppointmentDetailClient({
  appointment: initialAppt,
  userRole,
}: AppointmentDetailProps) {
  const [appointment, setAppointment] = useState(initialAppt);
  const [notes, setNotes] = useState(appointment.patientNotes || "");
  const [cancelReason, setCancelReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const isDoctor = userRole === "DOCTOR";

  // Counting down time left for patient to confirm the appointment (only for RESERVED status)
  useEffect(() => {
    if (
      isDoctor ||
      appointment.status !== "RESERVED" ||
      !appointment.reservedUntil
    )
      return;

    const interval = setInterval(() => {
      const seconds = differenceInSeconds(
        new Date(appointment.reservedUntil!),
        new Date(),
      );
      if (seconds <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [appointment, isDoctor]);

  const handlePatientConfirm = async () => {
    setIsConfirming(true);
    const result = await confirmAppointmentAction(appointment.id, notes);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Wizyta została potwierdzona!");
      setAppointment(result.data!);
    }
    setIsConfirming(false);
  };

  const handleDoctorCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Podaj powód odwołania wizyty.");
      return;
    }
    setIsCancelling(true);
    const result = await cancelByDoctorAction(appointment.id, cancelReason);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Wizyta została odwołana.");
      setAppointment(result.data!);
      setShowCancelForm(false);
    }
    setIsCancelling(false);
  };

  const handleDoctorNoShow = async () => {
    if (!confirm("Does the patient not attend the appointment?")) return;

    const result = await markAsNoShowAction(appointment.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Marked as not attended.");
      setAppointment(result.data!);
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  console.log(
    "Rendering AppointmentDetailClient with appointment:",
    appointment,
  );
  console.log("Is doctor:", isDoctor);
  console.log("User role:", userRole);

  return (
    <div className="space-y-6">
      <Link
        href={"/dashboard/appointments"}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to appointments list
      </Link>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Lewa kolumna: Informacje o wizycie */}
        <div className="md:col-span-2 space-y-6">
          <GlassPanel className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-foreground">
                  {appointment.serviceName}
                </h2>
                <p className="text-muted-foreground">
                  {isDoctor
                    ? `Patient ID: ${appointment.patientId}`
                    : `Appointment with Dr. ${appointment.doctorFirstName} ${appointment.doctorLastName}`}
                </p>
              </div>
              <Badge
                variant={
                  appointment.status === "SCHEDULED"
                    ? "success"
                    : appointment.status === "CANCELLED" ||
                        appointment.status === "NO_SHOW"
                      ? "destructive"
                      : "warning"
                }
                className="px-4 py-1"
              >
                {appointment.status}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 bg-black/5 dark:bg-white/5 p-6 rounded-2xl mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="text-accent" />
                <span className="font-bold">
                  {format(new Date(appointment.startTime), "EEEE, d MMMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-accent" />
                <span className="font-bold">
                  {format(new Date(appointment.startTime), "HH:mm")} -{" "}
                  {format(new Date(appointment.endTime), "HH:mm")}
                </span>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <MapPin className="text-accent" />
                <span className="font-bold">{appointment.centerName}</span>
              </div>
            </div>

            {/* NOTATKA DLA LEKARZA (Zawsze widoczna dla doktora, jeśli istnieje) */}
            {isDoctor && appointment.patientNotes && (
              <div className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                <h3 className="font-bold flex items-center gap-2 mb-2 text-primary">
                  <FileText size={18} />
                  Note from patient:
                </h3>
                <p className="text-sm italic text-foreground/80 whitespace-pre-wrap">
                  {appointment.patientNotes}
                </p>
              </div>
            )}

            {/* POWÓD ODWOŁANIA (Widoczny dla obu stron, jeśli wizyta jest odwołana) */}
            {appointment.status === "CANCELLED" && appointment.doctorNotes && (
              <div className="mb-8 p-6 bg-destructive/10 border border-destructive/20 rounded-2xl">
                <h3 className="font-bold flex items-center gap-2 mb-2 text-destructive">
                  <Ban size={18} />
                  Reason for cancellation:
                </h3>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {appointment.doctorNotes}
                </p>
              </div>
            )}

            {/* AKCJE DLA PACJENTA (Dokończenie rezerwacji) */}
            {!isDoctor && appointment.status === "RESERVED" && (
              <div className="p-6 border-2 border-dashed border-accent/30 rounded-2xl bg-accent/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <AlertCircle size={20} className="text-accent" />
                    Complete appointment booking
                  </h3>
                  {timeLeft !== null && (
                    <div
                      className={cn(
                        "text-xl font-mono font-black",
                        timeLeft < 120
                          ? "text-destructive animate-pulse"
                          : "text-accent",
                      )}
                    >
                      {formatTimeLeft(timeLeft)}
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  You have 15 minutes to confirm this appointment.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for the visit (optional)..."
                  className="w-full h-32 rounded-xl bg-background p-4 text-sm border border-border focus:ring-2 focus:ring-accent outline-none mb-4 resize-none"
                />
                <Button
                  onClick={handlePatientConfirm}
                  disabled={isConfirming || timeLeft === 0}
                  className="w-full h-12 rounded-xl shadow-lg"
                >
                  {isConfirming ? "Processing..." : "Confirm Appointment"}
                </Button>
              </div>
            )}

            {/* AKCJE DLA LEKARZA (Zarządzanie aktywną wizytą) */}
            {isDoctor && appointment.status === "SCHEDULED" && (
              <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-border/50">
                <h3 className="text-lg font-bold">Manage Appointment</h3>

                {!showCancelForm ? (
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 border-destructive/50 hover:bg-destructive/10 text-destructive"
                      onClick={() => setShowCancelForm(true)}
                    >
                      <Ban size={16} className="mr-2" /> Cancel Appointment
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleDoctorNoShow}
                    >
                      <UserMinus size={16} className="mr-2" /> Mark as not
                      attended
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-background border rounded-xl space-y-4">
                    <label className="text-sm font-bold">
                      Reason for cancellation (required):
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="E.g. Doctor's illness, emergency, etc..."
                      required
                      className="w-full h-24 rounded-xl bg-background p-3 text-sm border border-border focus:ring-2 focus:ring-destructive outline-none resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setShowCancelForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDoctorCancel}
                        disabled={isCancelling}
                      >
                        {isCancelling
                          ? "Cancelling..."
                          : "Confirm Cancellation"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CZAT (Dostępny dla obu stron, gdy wizyta jest potwierdzona) */}
            {appointment.status === "SCHEDULED" && (
              <div className="mt-8 border-t pt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-accent" />
                  Conversation
                </h3>
                <GlassCard className="p-12 text-center border-dashed">
                  <p className="text-muted-foreground italic">
                    Chat module will be launched soon.
                  </p>
                </GlassCard>
              </div>
            )}
          </GlassPanel>
        </div>

        {/* Prawa kolumna: Szybkie linki */}
        <div className="space-y-4 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">
            Related Pages
          </h3>

          {!isDoctor && (
            <Link href={`/doctors/${appointment.doctorPublicId}`}>
              <GlassCard className="p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">Doctor's Profile</p>
                  <p className="text-xs text-muted-foreground">
                    View reviews and profile information.
                  </p>
                </div>
              </GlassCard>
            </Link>
          )}

          <Link href={`/centers/${appointment.centerId}`}>
            <GlassCard className="p-4 flex items-center gap-4 hover:border-accent/50 transition-colors">
              <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <Building2 size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Medical Center</p>
                <p className="text-xs text-muted-foreground">
                  {appointment.centerName}
                </p>
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  );
}
