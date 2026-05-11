"use client";

import { useState } from "react";
import { Star, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass";
import { submitReviewAction } from "@/lib/actions/review"; // <--- IMPORT TWOJEJ AKCJI

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Funkcja pomocnicza do klas
  const cn = (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating before submitting your review.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please enter a review comment before submitting.");
      return;
    }

    setIsSubmitting(true);

    // UŻYWAMY SERVER ACTION ZAMIAST FETCH!
    const result = await submitReviewAction(appointmentId, {
      rating,
      comment,
      isAnonymous,
    });

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setReview(result.data);
      toast.success("Thank you! Your review has been published.");
    }

    setIsSubmitting(false);
  };

  // 1. Widok dla wizyt, które NIE są ukończone (tylko pacjent)
  if (!isDoctor && status !== "COMPLETED") {
    return (
      <div className="mt-8 pt-8 border-t border-border/50">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Star size={20} className="text-accent" />
          Review Appointment
        </h3>
        <div className="p-6 border-2 border-dashed border-accent/20 rounded-2xl bg-accent/5 flex items-start gap-4">
          <AlertCircle size={24} className="text-accent shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-foreground">
              Review submission is not yet available
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              The review button will appear here automatically when the
              appointment status changes to <strong>COMPLETED</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Wyświetlanie już wystawionej opinii (Dla Pacjenta i Lekarza)
  if (review) {
    return (
      <div className="mt-8 pt-8 border-t border-border/50">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Star size={20} className="text-accent" />
          {isDoctor ? "Patient's Review" : "Your Review"}
        </h3>
        <GlassCard className="p-6 border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              <span className="font-bold text-green-500 text-sm">
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
                      : "text-muted",
                  )}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-foreground/80 italic mb-4">
            "{review.patientComment}"
          </p>
          {review.doctorReply && (
            <div className="p-4 bg-background/50 rounded-xl border border-border">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground block mb-1">
                Doctor's Response:
              </span>
              <span className="text-sm text-foreground/90">
                {review.doctorReply}
              </span>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  // 3. Formularz wystawiania opinii (Tylko pacjent, status COMPLETED, brak opinii)
  if (!isDoctor && status === "COMPLETED") {
    return (
      <div className="mt-8 pt-8 border-t border-border/50">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
          <Star size={20} className="text-accent" />
          How was your visit?
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl border border-border/50">
            <label className="text-sm font-bold block mb-4">
              Your Rating (1-5 Stars)
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
              placeholder="Describe your experience with the appointment here..."
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

          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full h-12 rounded-xl shadow-lg font-bold"
          >
            {isSubmitting ? "Wysyłanie..." : "Wyślij opinię"}
          </Button>
        </form>
      </div>
    );
  }

  return null;
}
