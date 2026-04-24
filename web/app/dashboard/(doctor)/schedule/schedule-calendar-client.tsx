"use client";

import { useEffect, useState, useCallback } from "react";
import { format, addDays, endOfDay, isSameDay, startOfWeek } from "date-fns";
import { Loader2 } from "lucide-react";

import { GlassPanel } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import {
  getWorkingBlocksAction,
  type AvailabilityBlock,
} from "@/lib/actions/schedule";

import { CalendarHeader } from "./calendar-header";
import { WorkingBlockItem } from "./working-block-item";

export function ScheduleCalendarClient() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const endDate = addDays(startDate, 6);
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    const currentEndDate = addDays(startDate, 6);
    const startStr = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
    const endStr = format(endOfDay(currentEndDate), "yyyy-MM-dd'T'HH:mm:ss");

    const result = await getWorkingBlocksAction(startStr, endStr);
    if (!result.error && result.data) setBlocks(result.data);
    setLoading(false);
  }, [startDate.getTime()]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  useEffect(() => {
    const handleRefresh = () => fetchBlocks();
    window.addEventListener("refresh-schedule", handleRefresh);
    return () => window.removeEventListener("refresh-schedule", handleRefresh);
  }, [fetchBlocks]);

  return (
    <GlassPanel className="p-6 md:p-8">
      <CalendarHeader
        startDate={startDate}
        endDate={endDate}
        onDateChange={setStartDate}
        onRefresh={fetchBlocks}
      />

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
                  isToday &&
                    "bg-accent/5 dark:bg-white/5 -mx-6 px-6 rounded-2xl border-transparent",
                )}
              >
                <div className="w-28 shrink-0 flex flex-row md:flex-col items-baseline md:items-start gap-2 md:gap-0">
                  <p
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest",
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
                      <WorkingBlockItem
                        key={block.id}
                        block={block}
                        onRefresh={() => {
                          fetchBlocks();
                          window.dispatchEvent(new Event("refresh-schedule"));
                        }}
                      />
                    ))
                  ) : (
                    <div className="flex items-center h-full">
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
