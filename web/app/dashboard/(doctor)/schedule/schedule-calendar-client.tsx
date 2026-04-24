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
  Copy,
  Trash2,
} from "lucide-react";
import {
  getWorkingBlocksAction,
  copyWeekAction,
  deleteWorkingBlockAction,
  updateWorkingBlockAction,
  type AvailabilityBlock,
} from "@/lib/actions/schedule";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ScheduleCalendarClient() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [weeksToCopy, setWeeksToCopy] = useState("4");
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const endDate = addDays(startDate, 6);
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Function to fetch working blocks for the current week
  const fetchBlocks = useCallback(async () => {
    setLoading(true);

    const currentEndDate = addDays(startDate, 6);
    const startStr = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
    const endStr = format(endOfDay(currentEndDate), "yyyy-MM-dd'T'HH:mm:ss");

    const result = await getWorkingBlocksAction(startStr, endStr);

    if (!result.error && result.data) {
      setBlocks(result.data);
    }
    setLoading(false);
  }, [startDate.getTime()]);

  // First fetch when component mounts and whenever startDate changes
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Listener for "refresh-schedule" event to allow external triggers to refresh the schedule
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

  // Function to handle copying the week's schedule with user feedback
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

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.data?.message || "Schedule copied successfully!");
      fetchBlocks();
      window.dispatchEvent(new Event("refresh-schedule"));
    }
    setIsCopying(false);
  };

  // Function to handle deleting a working block with user feedback
  const handleDeleteBlock = async (blockId: string) => {
    setDeletingBlockId(blockId);

    const result = await deleteWorkingBlockAction(blockId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        result.data?.message || "Working block deleted successfully",
      );
      fetchBlocks();
      window.dispatchEvent(new Event("refresh-schedule"));
    }
    setDeletingBlockId(null);
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

        <div className="flex flex-wrap items-center gap-3">
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
              onClick={() => setStartDate(addDays(startDate, 7))}
            >
              <ChevronRight size={18} />
            </Button>

            <div className="w-px h-4 bg-black/10 dark:bg-white/20 mx-1" />

            <Button
              variant="ghost"
              className="h-8 px-4 text-xs font-bold text-accent dark:text-accent-light hover:bg-accent/10 dark:hover:bg-white/10 rounded-xl"
              onClick={() =>
                setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))
              }
            >
              Today
            </Button>
          </div>

          {/* Copy week button with popover */}
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
                        deletingBlockId={deletingBlockId}
                        setDeletingBlockId={setDeletingBlockId}
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
// ─────────────────────────────────────────────────────────────────────────────
// Single working block with Time slot edit and delete logic
// ─────────────────────────────────────────────────────────────────────────────

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

const TIME_SLOTS = generateTimeOptions();

function WorkingBlockItem({
  block,
  onRefresh,
  deletingBlockId,
  setDeletingBlockId,
}: {
  block: AvailabilityBlock;
  onRefresh: () => void;
  deletingBlockId: string | null;
  setDeletingBlockId: (id: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // States for the edit form (default to fetched block hours)
  const [editStart, setEditStart] = useState(
    format(new Date(block.startTime), "HH:mm"),
  );
  const [editEnd, setEditEnd] = useState(
    format(new Date(block.endTime), "HH:mm"),
  );

  const handleDelete = async () => {
    setDeletingBlockId(block.id);
    const result = await deleteWorkingBlockAction(block.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.data?.message || "Working block deleted.");
      onRefresh();
    }
    setDeletingBlockId(null);
    setIsOpen(false);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);

    // Construct full date ISO strings based on the selected day from the block
    const datePart = format(new Date(block.startTime), "yyyy-MM-dd");
    const newStartIso = `${datePart}T${editStart}:00`;
    const newEndIso = `${datePart}T${editEnd}:00`;

    const result = await updateWorkingBlockAction(block.id, {
      newStartTime: newStartIso,
      newEndTime: newEndIso,
    });

    if (result.error) toast.error(result.error);
    else {
      toast.success(result.data?.message || "Working block updated.");
      onRefresh();
      setIsOpen(false);
    }
    setIsUpdating(false);
  };

  const isDeleting = deletingBlockId === block.id;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 rounded-2xl bg-background/60 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-2.5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-primary/40 dark:hover:border-primary/40 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            (isDeleting || isUpdating) && "opacity-50 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            {isDeleting || isUpdating ? (
              <Loader2 size={14} className="animate-spin text-primary" />
            ) : (
              <Clock
                size={14}
                className="text-primary dark:text-accent-light"
              />
            )}
            {format(new Date(block.startTime), "HH:mm")} -{" "}
            {format(new Date(block.endTime), "HH:mm")}
          </div>
          <div className="w-px h-3 bg-black/10 dark:bg-white/20" />
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-muted-foreground/90">
            <MapPin size={12} className="opacity-70" />
            {block.centerName}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-4 rounded-2xl"
        align="center"
        side="top"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              Edit Shift Hours
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Appointments falling completely outside the new hours will be
              safely cancelled.
            </p>
          </div>

          {/* REPLACED: Native inputs swapped for Custom Selects */}
          <div className="flex items-center gap-2">
            <Select value={editStart} onValueChange={setEditStart}>
              <SelectTrigger className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] rounded-xl shadow-glass border-border/50">
                <SelectGroup>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem
                      key={time}
                      value={time}
                      className="rounded-lg text-sm"
                    >
                      {time}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <span className="text-muted-foreground text-xs font-bold">TO</span>

            <Select value={editEnd} onValueChange={setEditEnd}>
              <SelectTrigger className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] rounded-xl shadow-glass border-border/50">
                <SelectGroup>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem
                      key={time}
                      value={time}
                      className="rounded-lg text-sm"
                    >
                      {time}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
            <Button
              size="sm"
              className="w-full rounded-xl shadow-sm font-bold"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              Save Changes
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl text-xs font-bold"
              onClick={handleDelete}
            >
              Delete Entire Shift
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
