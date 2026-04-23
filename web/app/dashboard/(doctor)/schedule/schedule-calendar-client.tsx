"use client";

import { useEffect, useState } from "react";
import { format, addDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { Loader2, CalendarX, MapPin, Clock } from "lucide-react";
import {
  getWorkingBlocksAction,
  type AvailabilityBlock,
} from "@/lib/actions/schedule";
import { GlassPanel } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";

export function ScheduleCalendarClient() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));

  const endDate = addDays(startDate, 6); // 7 days view

  // Generate an array of 7 days for the UI
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const fetchBlocks = async () => {
    setLoading(true);

    const startStr = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
    const endStr = format(endOfDay(endDate), "yyyy-MM-dd'T'HH:mm:ss");

    const result = await getWorkingBlocksAction(startStr, endStr);

    if (!result.error && result.data) {
      setBlocks(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBlocks();
  }, [startDate]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">
          {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStartDate(addDays(startDate, -7))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStartDate(startOfDay(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStartDate(addDays(startDate, 7))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Calendar Grid / List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 size={32} className="animate-spin text-primary/50" />
          </div>
        ) : (
          days.map((day) => {
            const dayBlocks = blocks.filter((b) =>
              isSameDay(new Date(b.startTime), day),
            );

            const isToday = isSameDay(day, new Date());

            return (
              <GlassPanel
                key={day.toISOString()}
                className={`p-4 transition-all ${
                  isToday ? "ring-2 ring-primary/50 bg-primary/5" : ""
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Date Column */}
                  <div className="w-24 shrink-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {format(day, "EEEE")}
                    </p>
                    <p
                      className={`text-2xl font-bold ${isToday ? "text-primary" : "text-foreground"}`}
                    >
                      {format(day, "dd MMM")}
                    </p>
                  </div>

                  {/* Blocks Column */}
                  <div className="flex-1 flex flex-wrap gap-3">
                    {dayBlocks.length > 0 ? (
                      dayBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="flex flex-col gap-1 rounded-xl bg-background/50 border border-border/50 p-3 shadow-sm"
                        >
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <Clock size={14} className="text-primary" />
                            {format(new Date(block.startTime), "HH:mm")} -{" "}
                            {format(new Date(block.endTime), "HH:mm")}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            {block.centerName}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                        <CalendarX size={16} className="opacity-50" />
                        No working blocks scheduled
                      </div>
                    )}
                  </div>
                </div>
              </GlassPanel>
            );
          })
        )}
      </div>
    </div>
  );
}
