"use client";

import { useState, useTransition } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import {
  Loader2,
  CalendarOff,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Calendar as CalendarIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlassPanel } from "@/components/ui/glass";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

import {
  previewClearScheduleAction,
  clearScheduleAction,
  type PreviewClearScheduleResponse,
} from "@/lib/actions/schedule";

interface CenterOption {
  centerId: string;
  centerName: string;
}

interface VacationPlannerClientProps {
  centers: CenterOption[];
}

export function VacationPlannerClient({ centers }: VacationPlannerClientProps) {
  const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);
  const [centerId, setCenterId] = useState("__all__");
  const [reason, setReason] = useState("");

  const [preview, setPreview] = useState<PreviewClearScheduleResponse | null>(null);
  const [previewing, startPreview] = useTransition();
  const [isClearing, setIsClearing] = useState(false);

  const today = startOfDay(new Date());

  const isFormValid =
    rangeStart !== undefined &&
    rangeEnd !== undefined &&
    !isBefore(rangeEnd, rangeStart);

  const buildPayload = () => ({
    rangeStart: format(rangeStart!, "yyyy-MM-dd'T'00:00:00"),
    rangeEnd: format(rangeEnd!, "yyyy-MM-dd'T'23:59:59"),
    centerId: centerId === "__all__" ? undefined : centerId,
    reason: reason.trim() || undefined,
  });

  const handlePreview = () => {
    if (!isFormValid) return;
    setPreview(null);
    startPreview(async () => {
      const result = await previewClearScheduleAction(buildPayload());
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setPreview(result.data);
      }
    });
  };

  const handleClear = async () => {
    setIsClearing(true);
    const result = await clearScheduleAction(buildPayload());
    setIsClearing(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const { blocksDeleted, appointmentsCancelled } = result.data!;
    toast.success(
      `Done — ${blocksDeleted} ${blocksDeleted === 1 ? "block" : "blocks"} deleted, ` +
        `${appointmentsCancelled} ${appointmentsCancelled === 1 ? "appointment" : "appointments"} cancelled.`,
    );

    setRangeStart(undefined);
    setRangeEnd(undefined);
    setCenterId("__all__");
    setReason("");
    setPreview(null);
    window.dispatchEvent(new Event("refresh-schedule"));
  };

  const confirmDescription =
    preview && preview.appointmentsAffected > 0 ? (
      <span>
        This will permanently delete{" "}
        <strong>{preview.blocksAffected}</strong>{" "}
        {preview.blocksAffected === 1 ? "block" : "blocks"} and cancel{" "}
        <strong className="text-destructive">
          {preview.appointmentsAffected}{" "}
          {preview.appointmentsAffected === 1 ? "appointment" : "appointments"}
        </strong>
        . Patients will receive an e-mail notification.
        {reason.trim() && (
          <>
            {" "}
            Your message to them:{" "}
            <em>&ldquo;{reason.trim()}&rdquo;</em>
          </>
        )}
      </span>
    ) : (
      <span>
        This will delete{" "}
        <strong>{preview?.blocksAffected ?? 0}</strong>{" "}
        {preview?.blocksAffected === 1 ? "block" : "blocks"} with no active
        appointments.
      </span>
    );

  return (
    <div className="space-y-5">
      {/* Date range pickers */}
      <div className="grid grid-cols-2 gap-4">
        {/* From */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">
            From
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rounded-xl h-9 px-3 text-sm",
                  !rangeStart && "text-muted-foreground",
                )}
              >
                <CalendarIcon size={14} className="mr-2 opacity-50 shrink-0" />
                {rangeStart ? format(rangeStart, "dd MMM yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-none shadow-2xl rounded-3xl"
              align="start"
            >
              <GlassPanel className="p-2 border-none">
                <Calendar
                  mode="single"
                  selected={rangeStart}
                  onSelect={(date) => {
                    setRangeStart(date);
                    // If end is now before start, reset end
                    if (date && rangeEnd && isBefore(rangeEnd, date)) {
                      setRangeEnd(undefined);
                    }
                    setPreview(null);
                  }}
                  disabled={(date) => isBefore(date, today)}
                  initialFocus
                  className="bg-transparent"
                />
              </GlassPanel>
            </PopoverContent>
          </Popover>
        </div>

        {/* To */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">
            To
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rounded-xl h-9 px-3 text-sm",
                  !rangeEnd && "text-muted-foreground",
                )}
              >
                <CalendarIcon size={14} className="mr-2 opacity-50 shrink-0" />
                {rangeEnd ? format(rangeEnd, "dd MMM yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-none shadow-2xl rounded-3xl"
              align="end"
            >
              <GlassPanel className="p-2 border-none">
                <Calendar
                  mode="single"
                  selected={rangeEnd}
                  onSelect={(date) => {
                    setRangeEnd(date);
                    setPreview(null);
                  }}
                  disabled={(date) =>
                    isBefore(date, today) ||
                    (rangeStart !== undefined && isBefore(date, rangeStart))
                  }
                  initialFocus
                  className="bg-transparent"
                />
              </GlassPanel>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Center filter — only shown when doctor is in more than one center */}
      {centers.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">
            Medical Center
          </label>
          <Select
            value={centerId}
            onValueChange={(v) => {
              setCenterId(v);
              setPreview(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All centers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                <span className="flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground" />
                  All centers
                </span>
              </SelectItem>
              {centers.map((c) => (
                <SelectItem key={c.centerId} value={c.centerId}>
                  {c.centerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">
          Reason for patients{" "}
          <span className="font-normal normal-case">(optional)</span>
        </label>
        <Input
          placeholder='e.g. "Annual leave" or "Medical emergency"'
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
        />
      </div>

      {/* Preview button */}
      <Button
        variant="outline"
        className="w-full rounded-xl gap-2"
        disabled={!isFormValid || previewing}
        onClick={handlePreview}
      >
        {previewing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <CalendarOff size={14} />
        )}
        {previewing ? "Checking impact..." : "Preview Impact"}
      </Button>

      {/* Preview result */}
      {preview && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm space-y-1",
            preview.appointmentsAffected > 0
              ? "border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300"
              : "border-emerald-400/40 bg-emerald-50/60 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300",
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            {preview.appointmentsAffected > 0 ? (
              <AlertTriangle size={14} />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Impact preview
          </div>
          <p>
            <strong>{preview.blocksAffected}</strong>{" "}
            {preview.blocksAffected === 1 ? "block" : "blocks"} will be
            deleted.
          </p>
          <p>
            <strong>{preview.appointmentsAffected}</strong>{" "}
            {preview.appointmentsAffected === 1 ? "appointment" : "appointments"}{" "}
            will be cancelled
            {preview.appointmentsAffected > 0
              ? " — patients will be notified by e-mail."
              : "."}
          </p>

          {preview.blocksAffected === 0 ? (
            <p className="text-xs opacity-70 mt-1">
              No blocks found in this range.
            </p>
          ) : (
            <div className="pt-2">
              <ConfirmDialog
                title={
                  preview.appointmentsAffected > 0
                    ? "Cancel appointments and clear schedule?"
                    : "Clear schedule?"
                }
                description={confirmDescription}
                onConfirm={handleClear}
                confirmText="Yes, clear schedule"
                cancelText="Go back"
                destructive={preview.appointmentsAffected > 0}
              >
                <Button
                  variant={
                    preview.appointmentsAffected > 0 ? "destructive" : "default"
                  }
                  size="sm"
                  className="w-full rounded-xl font-bold gap-2"
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CalendarOff size={13} />
                  )}
                  Clear Schedule
                </Button>
              </ConfirmDialog>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
