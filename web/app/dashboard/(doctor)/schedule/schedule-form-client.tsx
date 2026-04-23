"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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

    // Zamiana wybranej daty i godziny na format ISO-8601 oczekiwany przez backend
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
      // Reset form
      setDate("");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground ml-1">
            From
          </label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground ml-1">
            To
          </label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !centerId || !date}
        className="w-full gap-2 rounded-xl mt-2"
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
