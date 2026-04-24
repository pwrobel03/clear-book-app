"use client";

import { useState, useEffect } from "react";
import { format, differenceInSeconds } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassPanel, GlassCard } from "@/components/ui/glass";
import { Badge } from "@/components/ui/badge";
import {
  confirmAppointmentAction,
  type AppointmentResponse,
} from "@/lib/actions/booking";
import Link from "next/link";

export function AppointmentDetailClient({
  appointment: initialAppt,
}: {
  appointment: AppointmentResponse;
}) {
  const [appointment, setAppointment] = useState(initialAppt);
  const [notes, setNotes] = useState(appointment.patientNotes || "");
  const [isConfirming, setIsConfirming] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Logika odliczania 15 minut dla statusu RESERVED
  useEffect(() => {
    if (appointment.status !== "RESERVED" || !appointment.reservedUntil) return;

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
  }, [appointment]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    const result = await confirmAppointmentAction(appointment.id, notes);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Appointment confirmed!");
      setAppointment(result.data!);
    }
    setIsConfirming(false);
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft size={16} className="mr-2" /> Return to appointments list
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
                  Appointment with Dr. {appointment.doctorFirstName}{" "}
                  {appointment.doctorLastName}
                </p>
              </div>
              <Badge
                variant={
                  appointment.status === "SCHEDULED" ? "success" : "warning"
                }
                className="px-4 py-1"
              >
                {appointment.status}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 bg-black/5 dark:bg-white/5 p-6 rounded-2xl">
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

            {/* Sekcja Potwierdzenia dla RESERVED */}
            {appointment.status === "RESERVED" && (
              <div className="mt-8 p-6 border-2 border-dashed border-accent/30 rounded-2xl bg-accent/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <AlertCircle size={20} className="text-accent" />
                    Complete Reservation
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
                  You have reserved this appointment slot, but it's not
                  confirmed yet. Please provide any additional notes for the
                  doctor and confirm your appointment within the next 15 minutes
                  to secure your spot. If you don't confirm in time, the slot
                  will be released back to the pool for other patients to book.
                </p>

                <label className="block text-sm font-bold mb-2">
                  Notes for the doctor (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for the visit..."
                  className="w-full h-32 rounded-xl bg-background p-4 text-sm border border-border focus:ring-2 focus:ring-accent outline-none mb-4 resize-none"
                />

                <Button
                  onClick={handleConfirm}
                  disabled={isConfirming || timeLeft === 0}
                  className="w-full h-12 rounded-xl shadow-lg"
                >
                  {isConfirming ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Confirm Appointment"
                  )}
                </Button>
              </div>
            )}

            {/* Czat (Placeholder) */}
            {appointment.status === "SCHEDULED" && (
              <div className="mt-8 border-t pt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-accent" />
                  Chat with Doctor
                </h3>
                <GlassCard className="p-12 text-center border-dashed">
                  <p className="text-muted-foreground italic">
                    Time Module will be available here for real-time
                    communication with your doctor before the appointment. Stay
                    tuned!
                  </p>
                </GlassCard>
              </div>
            )}
          </GlassPanel>
        </div>

        {/* Prawa kolumna: Szybkie linki */}
        <div className="space-y-4 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">
            Related pages
          </h3>

          <Link
            href={
              `/doctors/${appointment.doctorFirstName}-${appointment.doctorLastName}` /* Tu docelowo publicId */
            }
          >
            <GlassCard className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <User size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Doctor's Profile</p>
                <p className="text-xs text-muted-foreground">
                  Check review and other details about dr.{" "}
                  {appointment.doctorFirstName} {appointment.doctorLastName}
                </p>
              </div>
            </GlassCard>
          </Link>

          <Link href="/centers" /* Tu docelowo ID centrum */>
            <GlassCard className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <Building2 size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Medical center</p>
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
