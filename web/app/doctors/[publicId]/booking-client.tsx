"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek, isSameDay, endOfDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

import {
  getDoctorServicesAction,
  getAvailableSlotsAction,
  type DoctorServiceResponse,
  type AvailableSlotResponse,
} from "@/lib/actions/booking";

interface DoctorBookingClientProps {
  doctorId: string;
}

export function DoctorBookingClient({ doctorId }: DoctorBookingClientProps) {
  const [services, setServices] = useState<DoctorServiceResponse[]>([]);
  const [selectedService, setSelectedService] =
    useState<DoctorServiceResponse | null>(null);

  const [slots, setSlots] = useState<AvailableSlotResponse[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Stan kalendarza - domyślnie obecny tydzień
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);

  // 1. Pobieranie usług przy montowaniu
  useEffect(() => {
    const fetchServices = async () => {
      const result = await getDoctorServicesAction(doctorId);
      if (!result.error && result.data) {
        setServices(result.data);
        // Automatycznie wybierz pierwszą usługę, jeśli istnieje
        if (result.data.length > 0) {
          setSelectedService(result.data[0]);
        }
      }
    };
    fetchServices();
  }, [doctorId]);

  // 2. Pobieranie dynamicznych slotów, gdy zmieni się usługa lub tydzień
  const fetchSlots = useCallback(async () => {
    if (!selectedService) return;

    setIsLoadingSlots(true);
    const startIso = format(weekStart, "yyyy-MM-dd'T'00:00:00");
    const endIso = format(endOfDay(weekEnd), "yyyy-MM-dd'T'23:59:59"); // Upewnij się, że masz zaimportowane endOfDay z date-fns

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

  const handleBookSlot = (slot: AvailableSlotResponse) => {
    // TODO: W kolejnym kroku dodamy wywołanie backendu do rezerwacji
    toast.success(
      `Slot selected: ${format(new Date(slot.startTime), "HH:mm")}! Booking logic coming next.`,
    );
  };

  return (
    <div className="space-y-8">
      {/* ─── KROK 1: WYBÓR USŁUGI ─── */}
      <GlassPanel className="p-6">
        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
          <Clock className="text-primary" size={20} />
          1. Select Service
        </h3>
        {services.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="animate-spin" size={16} /> Loading services...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                <span className="font-bold text-foreground">
                  {service.name}
                </span>
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

      {/* ─── KROK 2: WYBÓR TERMINU (TABELA / SIATKA) ─── */}
      {selectedService && (
        <GlassPanel className="p-6 overflow-hidden">
          {/* Nagłówek i Nawigacja Kalendarza */}
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
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
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

          {/* Siatka Dni (Weekly Table) */}
          <div className="relative">
            {isLoadingSlots && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            )}

            {/* Responsywny Grid: Na telefonach scrollowany w poziomie, na PC 7 kolumn */}
            <div className="overflow-x-auto pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 sm:overflow-visible">
              <div className="grid grid-cols-7 gap-2 min-w-[600px] sm:min-w-0">
                {/* 1. Nagłówki dni (Tabela) */}
                {days.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={day.toISOString()}
                      className="flex flex-col items-center pb-4 border-b border-black/5 dark:border-white/10"
                    >
                      <span
                        className={cn(
                          "text-xs font-bold uppercase",
                          isToday ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={cn(
                          "text-xl font-black mt-1",
                          isToday ? "text-primary" : "text-foreground",
                        )}
                      >
                        {format(day, "dd")}
                      </span>
                    </div>
                  );
                })}

                {/* 2. Pigułki z godzinami pod dniami */}
                {days.map((day) => {
                  // Filtrujemy wyliczone sloty, żeby wyciągnąć te, które startują w danym dniu
                  const daySlots = slots.filter((s) =>
                    isSameDay(new Date(s.startTime), day),
                  );

                  return (
                    <div
                      key={`slots-${day.toISOString()}`}
                      className="flex flex-col gap-2 pt-4"
                    >
                      {daySlots.length > 0 ? (
                        daySlots.map((slot, idx) => (
                          <button
                            key={`${slot.startTime}-${idx}`}
                            onClick={() => handleBookSlot(slot)}
                            className="py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-xl transition-colors text-center shadow-sm"
                          >
                            {format(new Date(slot.startTime), "HH:mm")}
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground/40 text-sm font-medium">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
