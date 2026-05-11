"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale"; // Import English locale for date formatting
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { getDoctorReviewsAction } from "@/lib/actions/review";

export function DoctorReviewsSection({ publicId }: { publicId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchReviews = async (pageNum: number) => {
    pageNum === 0 ? setIsLoading(true) : setIsLoadingMore(true);

    const result = await getDoctorReviewsAction(publicId, pageNum, 5);

    if (pageNum === 0) {
      setReviews(result.content);
    } else {
      setReviews((prev) => [...prev, ...result.content]);
    }

    setTotalPages(result.totalPages);
    setPage(pageNum);
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    fetchReviews(0);
  }, [publicId]);

  if (isLoading) {
    return (
      <div className="animate-pulse h-32 bg-muted/10 rounded-2xl border border-border/50" />
    );
  }

  if (reviews.length === 0) {
    return (
      <GlassCard className="p-8 text-center border-dashed">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground font-medium">
          This doctor has no reviews yet.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Be the first person to review this doctor after your visit!
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <GlassCard key={review.id} className="p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
            <div>
              <span className="font-bold text-foreground block">
                {review.patientDisplayName}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.createdAt), "d MMMM yyyy", {
                  locale: enUS,
                })}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={
                    s <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-foreground/90 italic leading-relaxed">
            "{review.patientComment}"
          </p>

          {review.doctorReply && (
            <div className="mt-4 p-4 bg-background/50 rounded-xl border border-border">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground block mb-1">
                Doctor's Reply (
                {format(new Date(review.repliedAt), "d MMM yyyy", {
                  locale: enUS,
                })}
                ):
              </span>
              <span className="text-sm text-foreground/90">
                {review.doctorReply}
              </span>
            </div>
          )}
        </GlassCard>
      ))}

      {page + 1 < totalPages && (
        <Button
          variant="outline"
          onClick={() => fetchReviews(page + 1)}
          disabled={isLoadingMore}
          className="w-full mt-4 rounded-xl h-12"
        >
          {isLoadingMore ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : (
            "Load more reviews"
          )}
        </Button>
      )}
    </div>
  );
}
