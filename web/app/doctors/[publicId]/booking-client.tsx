"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, endOfDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Calendar as CalendarIcon,
  CheckCircle2,
  FileText,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  getDoctorServicesAction,
  getAvailableSlotsAction,
  bookAppointmentAction,
  type DoctorServiceResponse,
  type AvailableSlotResponse,
  type AppointmentResponse,
} from "@/lib/actions/booking";

interface DoctorBookingClientProps {
  doctorId: string;
  isAuthenticated: boolean;
  userRole?: string;
  doctorLastName: string;
}

export function DoctorBookingClient({
  doctorId,
  isAuthenticated,
  userRole,
  doctorLastName,
}: DoctorBookingClientProps) {
  const [services, setServices] = useState<DoctorServiceResponse[]>([]);
  const [selectedService, setSelectedService] =
    useState<DoctorServiceResponse | null>(null);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const [slots, setSlots] = useState<AvailableSlotResponse[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [bookingSlotTime, setBookingSlotTime] = useState<string | null>(null);

  // Confirmation state — shown after a successful RESERVED booking
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<AppointmentResponse | null>(null);

  // Patient notes input
  const [patientNotes, setPatientNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Calendar state — defaults to current week
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);

  // ── 1. Fetch services on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      const result = await getDoctorServicesAction(doctorId);

      if (!result.error && result.data) {
        setServices(result.data);
        if (result.data.length > 0) {
          setSelectedService(result.data[0]);
        }
      } else {
        toast.error("Could not load doctor services.");
      }
      setIsLoadingServices(false);
    };
    fetchServices();
  }, [doctorId]);

  // ── 2. Fetch slots whenever service or week changes ───────────────────────
  const fetchSlots = useCallback(async () => {
    if (!selectedService) return;

    setIsLoadingSlots(true);
    const startIso = format(weekStart, "yyyy-MM-dd'T'00:00:00");
    const endIso = format(endOfDay(weekEnd), "yyyy-MM-dd'T'23:59:59");

    const result = await getAvailableSlotsAction(
      doctorId,
      selectedService.id,
      startIso,
      endIso,
    );

    if (!result.error && result.data) {
      setSlots(result.data);
    } else {
      toast.error(result.error || "Failed to fetch slots");
    }
    setIsLoadingSlots(false);
  }, [doctorId, selectedService, weekStart]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // ── 3. Book a slot ────────────────────────────────────────────────────────
  const handleBookSlot = async (slot: AvailableSlotResponse) => {
    if (!selectedService) return;

    setBookingSlotTime(slot.startTime);

    const result = await bookAppointmentAction({
      blockId: slot.blockId,
      serviceId: selectedService.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      patientNotes: patientNotes.trim() || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      setConfirmedAppointment(result.data!);
      fetchSlots(); // remove booked slot from grid
    }

    setBookingSlotTime(null);
  };

  // ── 4. Reset after success ────────────────────────────────────────────────
  const handleBookAnother = () => {
    setConfirmedAppointment(null);
    setPatientNotes("");
    setShowNotes(false);
  };

  // ── Show no-services state ────────────────────────────────────────────────
  if (!isLoadingServices && services.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Dr. {doctorLastName} has not listed any services yet.
        </p>
      </GlassPanel>
    );
  }

  // ── Confirmation Screen ───────────────────────────────────────────────────
  if (confirmedAppointment) {
    return (
      <GlassPanel className="p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-foreground">
            Appointment Reserved!
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your slot is held for <span className="font-bold text-primary">15 minutes</span>.
            You can manage it in your{" "}
            <a
              href="/dashboard/appointments"
              className="font-bold text-accent underline underline-offset-2"
            >
              Appointments
            </a>{" "}
            dashboard.
          </p>
        </div>

        <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-5 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service</span>
            <span className="font-bold">{confirmedAppointment.serviceName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-bold">
              {format(new Date(confirmedAppointment.startTime), "EEE, MMM d, yyyy")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <span className="font-bold">
              {format(new Date(confirmedAppointment.startTime), "HH:mm")} –{" "}
              {format(new Date(confirmedAppointment.endTime), "HH:mm")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Location</span>
            <span className="font-bold">{confirmedAppointment.centerName}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className="text-yellow-600 border-yellow-500/40 bg-yellow-500/10">
              Reserved (15 min)
            </Badge>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            onClick={handleBookAnother}
          >
            Book Another
          </Button>
          <a href="/dashboard/appointments" className="flex-1">
            <Button className="w-full rounded-2xl">
              View My Appointments
            </Button>
          </a>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── STEP 1: Service Selection ─────────────────────────────────────── */}
      <GlassPanel className="p-6">
        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
          <Clock className="text-primary" size={20} />
          1. Select Service
        </h3>
        {isLoadingServices ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="animate-spin" size={16} /> Loading services...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={cn(
                  "flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selectedService?.id === service.id
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-background/50 border-black/5 dark:border-white/10 hover:border-primary/40 hover:shadow-md",
                )}
              >
                <span className="font-bold text-foreground">{service.name}</span>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">
                    {service.durationMinutes} min
                  </span>
                  <span className="font-black text-primary">
                    {service.price} PLN
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* ── STEP 2: Date & Time Selection ────────────────────────────────── */}
      {selectedService && (
        <GlassPanel className="p-6 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-black flex items-center gap-2">
              <CalendarIcon className="text-primary" size={20} />
              2. Choose Date & Time
            </h3>
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-bold min-w-[120px] text-center">
                {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => setWeekStart(addDays(weekStart, 7))}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* Slots Grid */}
          <div className="relative">
            {isLoadingSlots && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            )}

            <div className="overflow-x-auto pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:overflow-visible">
              <div className="grid grid-cols-7 gap-2 min-w-[320px]">
                {/* Day headers */}
                {days.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={day.toISOString()}
                      className="flex flex-col items-center pb-3 border-b border-black/5 dark:border-white/10"
                    >
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          isToday ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={cn(
                          "text-base font-black mt-0.5",
                          isToday ? "text-primary" : "text-foreground",
                        )}
                      >
                        {format(day, "dd")}
                      </span>
                    </div>
                  );
                })}

                {/* Slot pills */}
                {days.map((day) => {
                  const daySlots = slots.filter((s) =>
                    isSameDay(new Date(s.startTime), day),
                  );

                  return (
                    <div
                      key={`slots-${day.toISOString()}`}
                      className="flex flex-col gap-1.5 pt-3"
                    >
                      {daySlots.length > 0 ? (
                        daySlots.map((slot, idx) => {
                          const isBookingThis =
                            bookingSlotTime === slot.startTime;

                          return (
                            <button
                              key={`${slot.startTime}-${idx}`}
                              onClick={() => handleBookSlot(slot)}
                              disabled={
                                !isAuthenticated ||
                                isBookingThis ||
                                bookingSlotTime !== null
                              }
                              title={
                                !isAuthenticated
                                  ? "Sign in to book"
                                  : `Book at ${format(new Date(slot.startTime), "HH:mm")} — ${slot.centerName}`
                              }
                              className="py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-xl transition-colors text-center shadow-sm flex items-center justify-center min-h-[32px] disabled:opacity-50 disabled:pointer-events-none"
                            >
                              {isBookingThis ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                format(new Date(slot.startTime), "HH:mm")
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center py-3 text-muted-foreground/30 text-xs font-medium">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* No slots at all */}
          {!isLoadingSlots && slots.length === 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No available slots this week. Try the next week →
            </p>
          )}
        </GlassPanel>
      )}

      {/* ── STEP 3: Notes (optional) ─────────────────────────────────────── */}
      {selectedService && isAuthenticated && (
        <GlassPanel className="p-6">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-full text-left"
          >
            <FileText size={16} className="text-primary" />
            3. Add Notes (optional)
            {showNotes ? (
              <X size={14} className="ml-auto" />
            ) : (
              <span className="ml-auto text-xs text-muted-foreground/60">
                Click to expand
              </span>
            )}
          </button>

          {showNotes && (
            <textarea
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Describe your symptoms or any relevant information for the doctor..."
              className="mt-3 w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          )}
        </GlassPanel>
      )}
    </div>
  );
}
