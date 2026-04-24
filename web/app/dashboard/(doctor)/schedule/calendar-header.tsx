"use client";

import { useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GlassPanel } from "@/components/ui/glass";
import { copyWeekAction } from "@/lib/actions/schedule";

interface CalendarHeaderProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (date: Date) => void;
  onRefresh: () => void;
}

export function CalendarHeader({
  startDate,
  endDate,
  onDateChange,
  onRefresh,
}: CalendarHeaderProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [weeksToCopy, setWeeksToCopy] = useState("4");

  const handleDateSelect = (date: Date | undefined) => {
    if (date) onDateChange(startOfWeek(date, { weekStartsOn: 1 }));
  };

  const handleCopyWeek = async () => {
    const weeks = parseInt(weeksToCopy, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 12) {
      toast.error("Please enter a valid number of weeks (1-12).");
      return;
    }

    setIsCopying(true);
    const startStr = format(startDate, "yyyy-MM-dd'T'00:00:00");

    const result = await copyWeekAction({
      sourceWeekStart: startStr,
      weeksToCopy: weeks,
    });

    if (result.error) toast.error(result.error);
    else {
      toast.success(result.data?.message || "Schedule copied successfully!");
      onRefresh();
      window.dispatchEvent(new Event("refresh-schedule"));
    }
    setIsCopying(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h3 className="text-2xl font-black text-foreground tracking-tight">
          {format(startDate, "MMMM yyyy")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {format(startDate, "MMM d")} — {format(endDate, "MMM d")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-2xl bg-black/5 dark:bg-white/10 p-1 backdrop-blur-sm border border-black/5 dark:border-white/10 shadow-inner">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl hover:bg-white/50 dark:hover:bg-white/20"
            onClick={() => onDateChange(addDays(startDate, -7))}
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
              align="center"
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
            onClick={() => onDateChange(addDays(startDate, 7))}
          >
            <ChevronRight size={18} />
          </Button>

          <div className="w-px h-4 bg-black/10 dark:bg-white/20 mx-1" />

          <Button
            variant="ghost"
            className="h-8 px-4 text-xs font-bold text-accent dark:text-accent-light hover:bg-accent/10 dark:hover:bg-white/10 rounded-xl"
            onClick={() =>
              onDateChange(startOfWeek(new Date(), { weekStartsOn: 1 }))
            }
          >
            Today
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 rounded-2xl font-bold border-black/5 dark:border-white/10 shadow-sm hover:border-primary/30"
            >
              <Copy size={16} className="text-primary mr-2" />
              Copy Week
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-5" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm">Copy Schedule</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Duplicate all working blocks from this week into the future.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  How many weeks to copy? (1-12)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={weeksToCopy}
                  onChange={(e) => setWeeksToCopy(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Button
                className="w-full rounded-xl gap-2 shadow-md"
                disabled={isCopying}
                onClick={handleCopyWeek}
              >
                {isCopying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Copy size={16} />
                )}
                Confirm Copy
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
