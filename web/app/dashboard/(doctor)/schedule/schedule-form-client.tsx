"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Funkcja generująca opcje czasu co 15 minut (00:00, 00:15, ..., 23:45)
const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24 * 4; i++) {
    const hours = Math.floor(i / 4)
      .toString()
      .padStart(2, "0");
    const minutes = ((i % 4) * 15).toString().padStart(2, "0");
    options.push(`${hours}:${minutes}`);
  }

  // 8 godzin * 4 kwadranse = 32. Tniemy tablicę i zamieniamy kolejność!
  const startIndex = 32;
  return [...options.slice(startIndex), ...options.slice(0, startIndex)];
};

const TIME_OPTIONS = generateTimeOptions();

export function ScheduleFormClient({ centers }: { centers: CenterOption[] }) {
  const [loading, setLoading] = useState(false);
  const [centerId, setCenterId] = useState<string>("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!centerId || !date || !startTime || !endTime) {
      toast.error("Please fill in all fields.");
      return;
    }

    const startIso = new Date(`${date}T${startTime}:00`).toISOString();
    const endIso = new Date(`${date}T${endTime}:00`).toISOString();

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
      setDate("");
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
        {/* Input type="date" zostawiamy, bo natywne kalendarze (szczególnie na mobile) są bardzo wygodne */}
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
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
