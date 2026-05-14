"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import {
  Loader2,
  CalendarOff,
  AlertTriangle,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [centerId, setCenterId] = useState("__all__");
  const [reason, setReason] = useState("");

  const [preview, setPreview] = useState<PreviewClearScheduleResponse | null>(
    null,
  );
  const [previewing, startPreview] = useTransition();
  const [isClearing, setIsClearing] = useState(false);

  const isFormValid = rangeStart && rangeEnd && rangeStart < rangeEnd;

  const buildPayload = () => ({
    rangeStart: `${rangeStart}T00:00:00`,
    rangeEnd: `${rangeEnd}T23:59:59`,
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

    // Reset form and refresh the calendar
    setRangeStart("");
    setRangeEnd("");
    setCenterId("__all__");
    setReason("");
    setPreview(null);
    window.dispatchEvent(new Event("refresh-schedule"));
  };

  const confirmDescription =
    preview && preview.appointmentsAffected > 0 ? (
      <span>
        This will permanently delete <strong>{preview.blocksAffected}</strong>{" "}
        {preview.blocksAffected === 1 ? "block" : "blocks"} and cancel{" "}
        <strong className="text-destructive">
          {preview.appointmentsAffected}{" "}
          {preview.appointmentsAffected === 1 ? "appointment" : "appointments"}
        </strong>
        . Patients will receive an e-mail notification.
        {reason.trim() && (
          <>
            {" "}
            Your message to them: <em>&ldquo;{reason.trim()}&rdquo;</em>
          </>
        )}
      </span>
    ) : (
      <span>
        This will delete <strong>{preview?.blocksAffected ?? 0}</strong>{" "}
        {preview?.blocksAffected === 1 ? "block" : "blocks"} with no active
        appointments.
      </span>
    );

  return (
    <div className="space-y-5">
      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">
            From
          </label>
          <Input
            type="date"
            value={rangeStart}
            onChange={(e) => {
              setRangeStart(e.target.value);
              setPreview(null);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">
            To
          </label>
          <Input
            type="date"
            value={rangeEnd}
            min={rangeStart}
            onChange={(e) => {
              setRangeEnd(e.target.value);
              setPreview(null);
            }}
          />
        </div>
      </div>

      {/* Center filter */}
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
            {preview.blocksAffected === 1 ? "block" : "blocks"} will be deleted.
          </p>
          <p>
            <strong>{preview.appointmentsAffected}</strong>{" "}
            {preview.appointmentsAffected === 1
              ? "appointment"
              : "appointments"}{" "}
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
