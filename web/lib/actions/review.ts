"use server"

import { revalidatePath } from "next/cache"
import { springFetch } from "@/lib/server/spring"
import { callApi } from "@/lib/server/api-action"
import type { ActionResult } from "@/types/api"

// Jeśli nie masz jeszcze tego typu w @/types/api, możesz go tam przenieść
export interface ReviewResponse {
  id: string
  appointmentId: string
  rating: number
  patientComment: string
  doctorReply?: string
  repliedAt?: string
  createdAt: string
  patientDisplayName: string
  doctorId: string
  doctorFirstName: string
  doctorLastName: string
}

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