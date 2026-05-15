"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CancelReasonDialogProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  placeholder?: string;
  confirmText?: string;
  /** Called with the typed reason when confirmed. Return false to keep the dialog open. */
  onConfirm: (reason: string) => Promise<void> | void;
}

export function CancelReasonDialog({
  children,
  title = "Cancel Appointment",
  description = "Please provide a reason for the cancellation. This will be sent to the patient.",
  placeholder = "e.g. Doctor unavailable due to emergency...",
  confirmText = "Confirm Cancellation",
  onConfirm,
}: CancelReasonDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason before confirming.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onConfirm(reason.trim());
      setOpen(false);
      setReason("");
    } catch {
      // error is handled by the caller via toast
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!loading) {
      setOpen(v);
      if (!v) { setReason(""); setError(""); }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-1">
          <Textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(""); }}
            placeholder={placeholder}
            rows={4}
            className="resize-none rounded-xl"
            disabled={loading}
          />
          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Go back</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
