"use server"

import { revalidatePath } from "next/cache"
import { springFetch } from "@/lib/server/spring"
import { callApi } from "@/lib/server/api-action"
import type { ActionResult } from "@/types/api"
import type { ReviewResponse } from "@/types/api"
import type { SpringPage } from "@/types/api"

/**
 * Fetches a review for a specific appointment.
 *
 * Kept as a custom handler because the 404 case is semantically meaningful
 * (no review created yet → data: null) rather than an error.
 */
export async function getReviewAction(
  appointmentId: string
): Promise<ActionResult<ReviewResponse | null>> {
  try {
    const res = await springFetch(`/api/reviews/appointments/${appointmentId}`, {
      cache: "no-store",
    })

    if (res.status === 403) return { error: "Access denied." }
    if (res.status === 404) return { data: null }

    const json = await res.json()
    if (!res.ok) return { error: json.message ?? "Failed to load review." }

    return { data: json as ReviewResponse }
  } catch {
    return { error: "Service unavailable. Please try again later." }
  }
}

/**
 * Submits a new review for an appointment.
 */
export async function submitReviewAction(
  appointmentId: string,
  payload: { rating: number; comment: string; isAnonymous: boolean }
): Promise<ActionResult<ReviewResponse>> {
  const result = await callApi<ReviewResponse>(
    () =>
      springFetch(`/api/reviews/appointments/${appointmentId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    "Failed to submit review."
  )

  if (!result.error) {
    // Odświeżamy stronę wizyty, by od razu pokazać nową opinię
    revalidatePath(`/dashboard/appointments/${appointmentId}`)
  }

  return result
}

// Edit existing review (only for patients) or doctor's reply (only for doctors)
export async function updateReviewAction(
  reviewId: string,
  payload: { rating: number; comment: string; isAnonymous: boolean }
): Promise<ActionResult<ReviewResponse>> {
  const result = await callApi<ReviewResponse>(
    () =>
      springFetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    "Failed to update review."
  )
  return result
}

// Delete review (for patients) or doctor's reply (for doctors)
export async function deleteReviewAction(
  reviewId: string
): Promise<ActionResult<void>> {
  const result = await callApi<void>(
    () =>
      springFetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      }),
    "Failed to delete review."
  )
  return result
}

// Doctor's reply to a review
export async function replyToReviewAction(
  reviewId: string,
  reply: string
): Promise<ActionResult<ReviewResponse>> {
  const result = await callApi<ReviewResponse>(
    () =>
      springFetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        body: JSON.stringify({ reply }), // Matching the expected payload structure in the API
      }),
    "Failed to submit reply."
  )
  return result
}

// Edit doctor's reply to a review
export async function updateReplyAction(
  reviewId: string,
  reply: string
): Promise<ActionResult<ReviewResponse>> {
  const result = await callApi<ReviewResponse>(
    () =>
      springFetch(`/api/reviews/${reviewId}/reply`, {
        method: "PUT",
        body: JSON.stringify({ reply }),
      }),
    "Failed to update reply."
  )
  return result
}

// Delete doctor's reply to a review
export async function deleteReplyAction(
  reviewId: string
): Promise<ActionResult<ReviewResponse>> {
  const result = await callApi<ReviewResponse>(
    () =>
      springFetch(`/api/reviews/${reviewId}/reply`, {
        method: "DELETE",
      }),
    "Failed to delete reply."
  )
  return result
}

export async function getDoctorReviewsAction(
  publicId: string,
  page: number = 0,
  size: number = 5
): Promise<SpringPage<ReviewResponse>> {
  try {
    const res = await springFetch(`/api/doctors/${publicId}/reviews?page=${page}&size=${size}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { content: [], totalElements: 0, totalPages: 0, size, number: page };
    }
    return await res.json();
  } catch (error) {
    return { content: [], totalElements: 0, totalPages: 0, size, number: page };
  }
}