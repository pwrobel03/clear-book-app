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
  NotebookPen,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassPanel, GlassCard } from "@/components/ui/glass";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CancelReasonDialog } from "@/components/ui/cancel-reason-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  confirmAppointmentAction,
  cancelByDoctorAction,
  markAsNoShowAction,
  saveDoctorNotesAction,
  type AppointmentResponse,
} from "@/lib/actions/booking";

interface AppointmentDetailProps {
  appointment: AppointmentResponse;
  userRole: string;
}

export function AppointmentDetailClient({
  appointment: initialAppt,
  userRole,
}: AppointmentDetailProps) {
  const [appointment, setAppointment] = useState(initialAppt);
  const [patientNotes, setPatientNotes] = useState(appointment.patientNotes || "");
  const [doctorNotesDraft, setDoctorNotesDraft] = useState(appointment.doctorNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const isDoctor = userRole === "DOCTOR";

  const patientName =
    appointment.patientFirstName
      ? `${appointment.patientFirstName} ${appointment.patientLastName}`
      : "Patient";

  // Countdown timer for RESERVED appointments (patient side only)
  useEffect(() => {
    if (isDoctor || appointment.status !== "RESERVED" || !appointment.reservedUntil) return;

    const interval = setInterval(() => {
      const seconds = differenceInSeconds(new Date(appointment.reservedUntil!), new Date());
      if (seconds <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [appointment, isDoctor]);

  // Keep notes draft in sync if appointment reloads
  useEffect(() => {
    setDoctorNotesDraft(appointment.doctorNotes || "");
  }, [appointment.doctorNotes]);

  const handlePatientConfirm = async () => {
    setIsConfirming(true);
    const result = await confirmAppointmentAction(appointment.id, patientNotes);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Appointment confirmed!");
      setAppointment(result.data!);
    }
    setIsConfirming(false);
  };

  const handleDoctorCancel = async (reason: string) => {
    const result = await cancelByDoctorAction(appointment.id, reason);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error); // keeps dialog open
    }
    toast.success("Appointment cancelled.");
    setAppointment(result.data!);
  };

  const handleDoctorNoShow = async () => {
    const result = await markAsNoShowAction(appointment.id);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success("Marked as no-show.");
    setAppointment(result.data!);
  };

  const handleSaveDoctorNotes = async () => {
    setIsSavingNotes(true);
    const result = await saveDoctorNotesAction(appointment.id, doctorNotesDraft);
    if (result.error) {
      toast.error(result.error);
    } else {
      setAppointment(result.data!);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
      toast.success("Notes saved.");
    }
    setIsSavingNotes(false);
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const statusBadgeVariant =
    appointment.status === "SCHEDULED" || appointment.status === "COMPLETED"
      ? "success"
      : appointment.status === "CANCELLED" || appointment.status === "NO_SHOW"
      ? "destructive"
      : "warning";

  const statusLabel: Record<string, string> = {
    SCHEDULED: "Scheduled",
    RESERVED: "Pending confirmation",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    NO_SHOW: "No-show",
  };

  const notesEditable =
    isDoctor &&
    (appointment.status === "SCHEDULED" || appointment.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to appointments
      </Link>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* ── Main column ── */}
        <div className="xl:col-span-2 space-y-6">
          <GlassPanel className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 gap-4">
              <div>
                <h2 className="text-3xl font-black text-foreground">
                  {appointment.serviceName}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {isDoctor
                    ? `Patient: ${patientName}`
                    : `Appointment with Dr. ${appointment.doctorFirstName} ${appointment.doctorLastName}`}
                </p>
              </div>
              <Badge variant={statusBadgeVariant} className="px-4 py-1 shrink-0">
                {statusLabel[appointment.status] ?? appointment.status}
              </Badge>
            </div>

            {/* Date / time / location */}
            <div className="grid gap-4 sm:grid-cols-2 bg-black/5 dark:bg-white/5 p-6 rounded-2xl mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="text-accent shrink-0" />
                <span className="font-bold">
                  {format(new Date(appointment.startTime), "EEEE, d MMMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-accent shrink-0" />
                <span className="font-bold">
                  {format(new Date(appointment.startTime), "HH:mm")} –{" "}
                  {format(new Date(appointment.endTime), "HH:mm")}
                </span>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <MapPin className="text-accent shrink-0" />
                <span className="font-bold">{appointment.centerName}</span>
              </div>
            </div>

            {/* Patient note (visible to doctor) */}
            {isDoctor && appointment.patientNotes && (
              <div className="mb-6 p-5 bg-primary/5 border border-primary/20 rounded-2xl">
                <h3 className="font-bold flex items-center gap-2 mb-2 text-primary">
                  <FileText size={17} />
                  Note from patient
                </h3>
                <p className="text-sm italic text-foreground/80 whitespace-pre-wrap">
                  {appointment.patientNotes}
                </p>
              </div>
            )}

            {/* Cancellation reason */}
            {appointment.status === "CANCELLED" && appointment.doctorNotes && (
              <div className="mb-6 p-5 bg-destructive/10 border border-destructive/20 rounded-2xl">
                <h3 className="font-bold flex items-center gap-2 mb-2 text-destructive">
                  <Ban size={17} />
                  Reason for cancellation
                </h3>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {appointment.doctorNotes}
                </p>
              </div>
            )}

            {/* Doctor notes (editable for SCHEDULED / COMPLETED, read-only for patient) */}
            {isDoctor && notesEditable && (
              <div className="mb-6 p-5 border border-border/60 rounded-2xl space-y-3">
                <h3 className="font-bold flex items-center gap-2 text-foreground">
                  <NotebookPen size={17} className="text-accent" />
                  Doctor's notes
                </h3>
                <textarea
                  value={doctorNotesDraft}
                  onChange={(e) => {
                    setDoctorNotesDraft(e.target.value);
                    setNotesSaved(false);
                  }}
                  placeholder="Internal notes about this appointment (not shared with the patient)…"
                  rows={4}
                  className="w-full rounded-xl bg-background p-4 text-sm border border-border focus:ring-2 focus:ring-accent outline-none resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant={notesSaved ? "outline" : "default"}
                    onClick={handleSaveDoctorNotes}
                    disabled={isSavingNotes || doctorNotesDraft === (appointment.doctorNotes ?? "")}
                    className="min-w-[110px]"
                  >
                    {isSavingNotes ? (
                      <><Loader2 size={14} className="mr-2 animate-spin" /> Saving…</>
                    ) : notesSaved ? (
                      <><Check size={14} className="mr-2" /> Saved</>
                    ) : (
                      "Save notes"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Doctor notes (read-only display when status is completed and patient is viewing) */}
            {!isDoctor && appointment.status === "COMPLETED" && appointment.doctorNotes && (
              <div className="mb-6 p-5 bg-accent/5 border border-accent/20 rounded-2xl">
                <h3 className="font-bold flex items-center gap-2 mb-2 text-accent">
                  <NotebookPen size={17} />
                  Doctor's notes
                </h3>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {appointment.doctorNotes}
                </p>
              </div>
            )}

            {/* ── Patient: complete reservation ── */}
            {!isDoctor && appointment.status === "RESERVED" && (
              <div className="p-6 border-2 border-dashed border-accent/30 rounded-2xl bg-accent/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <AlertCircle size={20} className="text-accent" />
                    Complete your booking
                  </h3>
                  {timeLeft !== null && (
                    <div
                      className={cn(
                        "text-xl font-mono font-black",
                        timeLeft < 120 ? "text-destructive animate-pulse" : "text-accent",
                      )}
                    >
                      {formatTimeLeft(timeLeft)}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  You have 15 minutes to confirm this appointment. You can optionally leave a note for your doctor.
                </p>
                <textarea
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for the visit (optional)…"
                  className="w-full h-32 rounded-xl bg-background p-4 text-sm border border-border focus:ring-2 focus:ring-accent outline-none mb-4 resize-none"
                />
                <Button
                  onClick={handlePatientConfirm}
                  disabled={isConfirming || timeLeft === 0}
                  className="w-full h-12 rounded-xl shadow-lg"
                >
                  {isConfirming ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Confirming…</>
                  ) : (
                    "Confirm Appointment"
                  )}
                </Button>
              </div>
            )}

            {/* ── Doctor: manage active appointment ── */}
            {isDoctor && appointment.status === "SCHEDULED" && (
              <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-border/50">
                <h3 className="text-lg font-bold">Manage Appointment</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <CancelReasonDialog
                    title="Cancel Appointment"
                    description="Please provide a reason for the cancellation. This will be visible to the patient."
                    confirmText="Confirm Cancellation"
                    onConfirm={handleDoctorCancel}
                  >
                    <Button
                      variant="outline"
                      className="flex-1 border-destructive/50 hover:bg-destructive/10 text-destructive"
                    >
                      <Ban size={16} className="mr-2" /> Cancel Appointment
                    </Button>
                  </CancelReasonDialog>

                  <ConfirmDialog
                    title="Mark as No-Show"
                    description={`Are you sure you want to mark ${patientName}'s appointment as a no-show? This action cannot be undone.`}
                    confirmText="Mark as No-Show"
                    onConfirm={handleDoctorNoShow}
                  >
                    <Button variant="outline" className="flex-1">
                      <UserMinus size={16} className="mr-2" /> Mark as No-Show
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>
            )}

            {/* ── Chat placeholder (SCHEDULED only) ── */}
            {appointment.status === "SCHEDULED" && (
              <div className="mt-8 border-t pt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-accent" />
                  Conversation
                </h3>
                <GlassCard className="p-12 text-center border-dashed">
                  <p className="text-muted-foreground italic">
                    Chat module coming soon.
                  </p>
                </GlassCard>
              </div>
            )}
          </GlassPanel>
        </div>

        {/* ── Right sidebar: related pages ── */}
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
