"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Plus, Clock, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { GlassPanel } from "@/components/ui/glass";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createWorkingBlockAction } from "@/lib/actions/schedule";

interface CenterOption {
  centerId: string;
  centerName: string;
}

// Generates time options every 15 minutes (00:00, 00:15, ..., 23:45)
const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24 * 4; i++) {
    const hours = Math.floor(i / 4)
      .toString()
      .padStart(2, "0");
    const minutes = ((i % 4) * 15).toString().padStart(2, "0");
    options.push(`${hours}:${minutes}`);
  }

  const startIndex = 32;
  return [...options.slice(startIndex), ...options.slice(0, startIndex)];
};

const TIME_OPTIONS = generateTimeOptions();

export function ScheduleFormClient({ centers }: { centers: CenterOption[] }) {
  const [loading, setLoading] = useState(false);
  const [centerId, setCenterId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!centerId || !date || !startTime || !endTime) {
      toast.error("Please fill in all fields.");
      return;
    }

    const dateStr = format(date, "yyyy-MM-dd");
    const startIso = `${dateStr}T${startTime}:00`;
    const endIso = `${dateStr}T${endTime}:00`;

    setLoading(true);
    const result = await createWorkingBlockAction({
      centerId,
      startTime: startIso,
      endTime: endIso,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Working block created successfully!");
      setDate(undefined);
      window.dispatchEvent(new Event("refresh-schedule"));
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground ml-1">
          Medical Center
        </label>
        <Select value={centerId} onValueChange={setCenterId}>
          <SelectTrigger>
            <SelectValue placeholder="Select center" />
          </SelectTrigger>
          <SelectContent>
            {centers.map((c) => (
              <SelectItem key={c.centerId} value={c.centerId}>
                {c.centerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground ml-1">
          Date
        </label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon size={14} className="mr-2 opacity-50" />
              {date ? (
                format(date, "EEE, d MMM yyyy")
              ) : (
                <span className="text-muted-foreground">Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-none shadow-2xl rounded-3xl"
            align="start"
          >
            <GlassPanel className="p-2 border-none">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setCalendarOpen(false);
                }}
                disabled={(d) =>
                  d < new Date(new Date().setHours(0, 0, 0, 0))
                }
                initialFocus
                className="bg-transparent"
              />
            </GlassPanel>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground ml-1">
            <Clock size={14} className="text-muted-foreground" /> From
          </label>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger>
              <SelectValue placeholder="Start time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((time) => (
                <SelectItem key={`start-${time}`} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground ml-1">
            <Clock size={14} className="text-muted-foreground" /> To
          </label>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger>
              <SelectValue placeholder="End time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((time) => (
                <SelectItem key={`end-${time}`} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !centerId || !date}
        className="w-full gap-2 rounded-xl mt-4 shadow-md"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Plus size={16} />
        )}
        Create Block
      </Button>
    </form>
  );
}
