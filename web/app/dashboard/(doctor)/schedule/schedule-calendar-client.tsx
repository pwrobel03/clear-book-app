"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format,
  addDays,
  startOfDay,
  endOfDay,
  isSameDay,
  startOfWeek,
} from "date-fns";
import {
  Loader2,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getWorkingBlocksAction,
  type AvailabilityBlock,
} from "@/lib/actions/schedule";
import { GlassPanel } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ScheduleCalendarClient() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  // Zostawiamy te zmienne do renderowania widoku
  const endDate = addDays(startDate, 6);
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // POPRAWKA: Używamy startDate.getTime() w tablicy zależności,
  // co daje 100% gwarancji, że funkcja odświeży się TYLKO gdy użytkownik zmieni tydzień.
  const fetchBlocks = useCallback(async () => {
    setLoading(true);

    // Obliczamy koniec tygodnia lokalnie, by nie polegać na zmiennych renderowanych z zewnątrz
    const currentEndDate = addDays(startDate, 6);
    const startStr = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
    const endStr = format(endOfDay(currentEndDate), "yyyy-MM-dd'T'HH:mm:ss");

    const result = await getWorkingBlocksAction(startStr, endStr);

    if (!result.error && result.data) {
      setBlocks(result.data);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate.getTime()]); // Zależnością jest tylko prymitywna liczba (timestamp), co ucina nieskończoną pętlę!

  // Pierwsze pobranie i reakcja na zmianę tygodnia
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Nasłuchiwanie na event z formularza ("Create Block")
  useEffect(() => {
    const handleRefresh = () => fetchBlocks();
    window.addEventListener("refresh-schedule", handleRefresh);
    return () => window.removeEventListener("refresh-schedule", handleRefresh);
  }, [fetchBlocks]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setStartDate(startOfWeek(date, { weekStartsOn: 1 }));
    }
  };

  return (
    <GlassPanel className="p-6 md:p-8">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-black text-foreground tracking-tight">
            {format(startDate, "MMMM yyyy")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {format(startDate, "MMM d")} — {format(endDate, "MMM d")}
          </p>
        </div>

        {/* Nawigacja — w trybie ciemnym nieco jaśniejsza ramka */}
        <div className="flex items-center gap-1 rounded-2xl bg-black/5 dark:bg-white/10 p-1 backdrop-blur-sm border border-black/5 dark:border-white/10 shadow-inner">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl hover:bg-white/50 dark:hover:bg-white/20"
            onClick={() => setStartDate(addDays(startDate, -7))}
          >
            <ChevronLeft size={18} />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 px-4 text-xs font-bold hover:bg-white/50 dark:hover:bg-white/20 rounded-xl"
              >
                <CalendarIcon size={14} className="mr-2 opacity-50" />
                Select Week
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-none shadow-2xl rounded-3xl"
              align="end"
            >
              <GlassPanel className="p-2 border-none">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="bg-transparent"
                />
              </GlassPanel>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl hover:bg-white/50 dark:hover:bg-white/20"
            onClick={() => setStartDate(addDays(startDate, 7))}
          >
            <ChevronRight size={18} />
          </Button>

          <div className="w-px h-4 bg-black/10 dark:bg-white/20 mx-1" />

          <Button
            variant="ghost"
            className="h-8 px-4 text-xs font-bold underline text-foreground dark:text-accent-light hover:bg-accent/10 dark:hover:bg-white/10 rounded-xl"
            onClick={() =>
              setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))
            }
          >
            Today
          </Button>
        </div>
      </div>

      {/* ─── LISTA DNI ─── */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2
            size={32}
            className="animate-spin text-muted-foreground/50"
          />
        </div>
      ) : (
        <div className="flex flex-col relative">
          {days.map((day, index) => {
            const dayBlocks = blocks.filter((b) =>
              isSameDay(new Date(b.startTime), day),
            );
            const isToday = isSameDay(day, new Date());
            const hasBlocks = dayBlocks.length > 0;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "group relative flex flex-col md:flex-row md:items-center gap-4 py-5 transition-all",
                  index !== 0 && "border-t border-black/5 dark:border-white/10",
                  // Jaśniejsze, szklane tło dla "dzisiaj" w dark mode
                  isToday &&
                    "bg-accent/5 dark:bg-white/5 -mx-6 px-6 rounded-2xl border-transparent",
                )}
              >
                <div className="w-28 shrink-0 flex flex-row md:flex-col items-baseline md:items-start gap-2 md:gap-0">
                  <p
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest",
                      // Rozjaśniony akcent w dark mode dla czytelności
                      isToday
                        ? "text-accent dark:text-accent-light"
                        : "text-muted-foreground/70 dark:text-muted-foreground/60",
                    )}
                  >
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-black",
                      // Biel dla dzisiejszego dnia w dark mode
                      isToday
                        ? "text-accent dark:text-white"
                        : hasBlocks
                          ? "text-foreground"
                          : "text-foreground/40 dark:text-white/30",
                    )}
                  >
                    {format(day, "dd")}
                  </p>
                </div>

                <div className="flex-1 flex flex-wrap gap-2 md:gap-3">
                  {hasBlocks ? (
                    dayBlocks.map((block) => (
                      <div
                        key={block.id}
                        // Zmiana tła pigułki w dark mode na półprzezroczystą biel
                        className="flex items-center gap-3 rounded-2xl bg-background/60 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-2.5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-primary/30 dark:hover:border-white/20"
                      >
                        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          {/* Ikona zegara jaśniejsza w dark mode */}
                          <Clock
                            size={14}
                            className="text-primary dark:text-accent-light"
                          />
                          {format(new Date(block.startTime), "HH:mm")} -{" "}
                          {format(new Date(block.endTime), "HH:mm")}
                        </div>
                        <div className="w-px h-3 bg-black/10 dark:bg-white/20" />
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-muted-foreground/90">
                          <MapPin size={12} className="opacity-70" />
                          {block.centerName}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center h-full">
                      {/* Czytelniejsza kreska dla pustych dni w trybie ciemnym */}
                      <p className="text-sm font-medium text-muted-foreground/40 dark:text-white/20 italic">
                        —
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}
