"use client";

import { useState } from "react";
import {
  Star,
  AlertCircle,
  CheckCircle2,
  MessageSquareReply,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  submitReviewAction,
  updateReviewAction,
  deleteReviewAction,
  replyToReviewAction,
  updateReplyAction,
  deleteReplyAction,
} from "@/lib/actions/review";

interface AppointmentReviewSectionProps {
  appointmentId: string;
  status: string;
  isDoctor: boolean;
  initialReview: any | null;
}

export function AppointmentReviewSection({
  appointmentId,
  status,
  isDoctor,
  initialReview,
}: AppointmentReviewSectionProps) {
  const [review, setReview] = useState<any>(initialReview);

  // Stany formularza pacjenta
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [comment, setComment] = useState(initialReview?.patientComment || "");
  const [isAnonymous, setIsAnonymous] = useState(
    initialReview?.isAnonymous || false,
  );

  // State of the doctor's reply form
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  // New state for editing doctor's reply
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [editedReplyText, setEditedReplyText] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const cn = (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" ");

  // --- Patient logic ---
  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a star rating.");
    if (!comment.trim()) return toast.error("Please write a comment before submitting.");

    setIsSubmitting(true);

    const action = review?.id
      ? updateReviewAction(review.id, { rating, comment, isAnonymous })
      : submitReviewAction(appointmentId, { rating, comment, isAnonymous });

    const result = await action;

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setReview(result.data);
      setIsEditing(false);
      toast.success(
        review?.id
          ? "Update: Your opinion has been updated!"
          : "Success: Your opinion has been submitted!",
      );
    }
    setIsSubmitting(false);
  };

  const handlePatientDelete = async () => {
    setIsSubmitting(true);
    const result = await deleteReviewAction(review.id);

    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error); // keeps ConfirmDialog open
    } else {
      setReview(null);
      setRating(0);
      setComment("");
      setIsAnonymous(false);
      setIsEditing(false);
      toast.success("Your review has been deleted.");
    }
    setIsSubmitting(false);
  };

  // --- LOGIKA LEKARZA ---
  const handleDoctorReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return toast.error("Response cannot be empty.");

    setIsSubmitting(true);
    const result = await replyToReviewAction(review.id, replyText);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setReview(result.data);
      setIsReplying(false);
      toast.success("Update: Your reply has been submitted!");
    }
    setIsSubmitting(false);
  };

  const handleDoctorReplyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedReplyText.trim())
      return toast.error("Response cannot be empty.");

    setIsSubmitting(true);
    const result = await updateReplyAction(review.id, editedReplyText);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setReview(result.data);
      setIsEditingReply(false);
      toast.success("Update: Your reply has been updated!");
    }
    setIsSubmitting(false);
  };

  const handleDoctorReplyDelete = async () => {
    setIsSubmitting(true);
    const result = await deleteReplyAction(review.id);

    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error); // keeps ConfirmDialog open
    } else if (result.data) {
      setReview(result.data);
      setIsEditingReply(false);
      setReplyText("");
      toast.success("Reply deleted.");
    }
    setIsSubmitting(false);
  };

  // --- WIDOKI ---

  if (!isDoctor && status !== "COMPLETED") {
    return (
      <div className="mt-8 pt-8 border-t border-border/50">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Star size={20} className="text-accent" /> Review Appointment
        </h3>
        <div className="p-6 border-2 border-dashed border-accent/20 rounded-2xl bg-accent/5 flex items-start gap-4">
          <AlertCircle size={24} className="text-accent shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-foreground">
              Review will be available after the appointment is completed.
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              The review button will appear automatically once the appointment
              is marked as COMPLETED.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // WIDOK: Formularz Pacjenta (Nowy lub Edycja)
  if (!isDoctor && status === "COMPLETED" && (!review || isEditing)) {
    return (
      <div className="mt-8 pt-8 border-t border-border/50">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <Star size={20} className="text-accent" />
          {isEditing
            ? "Edit your review"
            : "How would you rate your appointment?"}
        </h3>

        {isEditing && review?.doctorReply && (
          <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-sm">
            <strong>Notice:</strong> The doctor has already replied to your
            review. Changing the comment may disrupt the context of their
            response.
          </div>
        )}

        <form onSubmit={handlePatientSubmit} className="space-y-6">
          <div className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-border/50">
            <label className="text-sm font-bold block mb-4">
              Your rating (1-5 stars)
            </label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={32}
                    className={cn(
                      "transition-colors",
                      s <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold block ml-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your experience with the appointment..."
              disabled={isSubmitting}
              className="w-full h-32 rounded-2xl bg-black/5 dark:bg-white/5 p-4 text-sm border border-border focus:ring-2 focus:ring-accent outline-none resize-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 p-2">
            <input
              type="checkbox"
              id="anon-toggle"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-transparent"
            />
            <label
              htmlFor="anon-toggle"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Publish my review anonymously
            </label>
          </div>

          <div className="flex gap-3">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-[2] h-12 rounded-xl shadow-lg font-bold"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Publish Review"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // WIDOK: Podgląd wystawionej opinii (Pacjent / Lekarz)
  if (review) {
    const isEdited =
      review.updatedAt &&
      review.createdAt &&
      new Date(review.updatedAt).getTime() -
        new Date(review.createdAt).getTime() >
        1000;

    return (
      <div className="mt-8 pt-8 border-t border-border/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Star size={20} className="text-accent" />{" "}
            {isDoctor ? "Patient Review" : "Your Review"}
          </h3>

          {/* Patient review actions */}
          {!isDoctor && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <Edit2 size={14} className="mr-2" /> Edit
              </Button>
              <ConfirmDialog
                title="Delete Review"
                description="Are you sure you want to delete your review? This action cannot be undone."
                confirmText="Delete"
                onConfirm={handlePatientDelete}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} className="mr-2" /> Delete
                </Button>
              </ConfirmDialog>
            </div>
          )}
        </div>

        <GlassCard className="p-6 border-accent/20 bg-accent/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-accent" />
              <span className="font-bold text-accent text-sm">
                Appointment Rated
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={cn(
                    "transition-all",
                    s <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-foreground/90 italic mb-1">
            "{review.patientComment}"
          </p>
          {isEdited && (
            <p className="text-[11px] text-muted-foreground mb-4">(Edited)</p>
          )}

          {/* Sekcja Odpowiedzi Lekarza */}
          {review.doctorReply ? (
            <div className="mt-6 p-4 bg-background/50 rounded-xl border border-border">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground block">
                  Doctor's Reply:
                </span>

                {/* Doctor reply actions */}
                {isDoctor && !isEditingReply && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedReplyText(review.doctorReply);
                        setIsEditingReply(true);
                      }}
                      className="h-6 px-2 py-0 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 size={12} className="mr-1" /> Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete Reply"
                      description="Are you sure you want to delete your reply to this review?"
                      confirmText="Delete"
                      onConfirm={handleDoctorReplyDelete}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 py-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={12} className="mr-1" /> Delete
                      </Button>
                    </ConfirmDialog>
                  </div>
                )}
              </div>

              {/* Formularz edycji odpowiedzi przez lekarza */}
              {isEditingReply ? (
                <form
                  onSubmit={handleDoctorReplyEdit}
                  className="mt-2 space-y-3"
                >
                  <textarea
                    value={editedReplyText}
                    onChange={(e) => setEditedReplyText(e.target.value)}
                    className="w-full h-24 rounded-lg bg-black/5 dark:bg-white/5 p-3 text-sm border border-border focus:ring-2 focus:ring-accent outline-none resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingReply(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting || !editedReplyText.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <span className="text-sm text-foreground/90">
                  {review.doctorReply}
                </span>
              )}
            </div>
          ) : (
            isDoctor && (
              <div className="mt-6">
                {!isReplying ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsReplying(true)}
                    className="w-full sm:w-auto"
                  >
                    <MessageSquareReply size={16} className="mr-2" /> Reply to
                    Patient
                  </Button>
                ) : (
                  <form
                    onSubmit={handleDoctorReplySubmit}
                    className="space-y-4 p-4 bg-background border rounded-xl"
                  >
                    <label className="text-sm font-bold block">
                      Your Reply:
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply to the patient..."
                      className="w-full h-24 rounded-xl bg-black/5 dark:bg-white/5 p-3 text-sm border border-border focus:ring-2 focus:ring-accent outline-none resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsReplying(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !replyText.trim()}
                      >
                        Publish Reply
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )
          )}
        </GlassCard>
      </div>
    );
  }

  if (isDoctor && status === "COMPLETED") {
    return (
      <div className="mt-8 pt-8 border-t border-border/50">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Star size={20} className="text-accent" /> Patient Review
        </h3>
        <p className="text-sm text-muted-foreground">
          Patient has not submitted a review for this appointment yet.
        </p>
      </div>
    );
  }

  return null;
}
