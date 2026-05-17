"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Clock, MapPin, CalendarX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

import {
  deleteWorkingBlockAction,
  updateWorkingBlockAction,
  type AvailabilityBlock,
} from "@/lib/actions/schedule";

const generateTimeOption = () => {
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

const TIME_SLOTS = generateTimeOption();

export function WorkingBlockItem({
  block,
  onRefresh,
}: {
  block: AvailabilityBlock;
  onRefresh: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editStart, setEditStart] = useState(
    format(new Date(block.startTime), "HH:mm"),
  );
  const [editEnd, setEditEnd] = useState(
    format(new Date(block.endTime), "HH:mm"),
  );

  const hasAppointments = block.appointmentCount > 0;

  const performDelete = async () => {
    setIsDeleting(true);
    const result = await deleteWorkingBlockAction(block.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.data?.message || "Working block deleted.");
      onRefresh();
    }
    setIsDeleting(false);
    setIsOpen(false);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
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

  const isLoading = isDeleting || isUpdating;

  const deleteDescription = hasAppointments ? (
    <span>
      This shift has{" "}
      <strong className="text-destructive">
        {block.appointmentCount} active{" "}
        {block.appointmentCount === 1 ? "appointment" : "appointments"}
      </strong>{" "}
      that will be automatically cancelled and patients will be notified by
      e-mail. This action cannot be undone.
    </span>
  ) : (
    "This working block has no appointments. It will be permanently deleted."
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 rounded-2xl bg-background/60 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-2.5 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-primary/40 dark:hover:border-primary/40 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            isLoading && "opacity-50 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            {isLoading ? (
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
          {hasAppointments && (
            <>
              <div className="w-px h-3 bg-black/10 dark:bg-white/20" />
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <CalendarX size={12} />
                {block.appointmentCount}
              </div>
            </>
          )}
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

            {/* Always render delete through ConfirmDialog for safety */}
            <ConfirmDialog
              title={
                hasAppointments
                  ? `Delete shift with ${block.appointmentCount} ${block.appointmentCount === 1 ? "appointment" : "appointments"}?`
                  : "Delete this shift?"
              }
              description={deleteDescription}
              onConfirm={performDelete}
              confirmText="Yes, delete shift"
              cancelText="Keep shift"
              destructive
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl text-xs font-bold"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 size={12} className="animate-spin mr-1" />
                ) : null}
                Delete Entire Shift
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
