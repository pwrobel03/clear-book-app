"use server"

import { revalidatePath } from "next/cache"

import { springFetch } from "@/lib/server/spring"
import { callApi, callApiVoid } from "@/lib/server/api-action"
import type {
  ActionResult,
  MedicalCenterResponse,
  PendingDoctorResponse,
  VerificationAction,
  VoidResult,
} from "@/types/api"

export async function getPendingDoctorsAction(): Promise<ActionResult<PendingDoctorResponse[]>> {
  return callApi<PendingDoctorResponse[]>(
    () => springFetch("/api/admin/doctors/pending"),
    "Failed to fetch pending doctors."
  )
}

export async function verifyDoctorAction(
  userId: string,
  action: VerificationAction
): Promise<VoidResult> {
  const result = await callApiVoid(
    () =>
      springFetch(`/api/admin/doctors/${userId}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }),
    "Failed to verify doctor."
  )

  if (!result.error) revalidatePath("/dashboard/verifications")

  return result
}

export async function getPendingCentersAction(): Promise<ActionResult<MedicalCenterResponse[]>> {
  return callApi<MedicalCenterResponse[]>(
    () => springFetch("/api/admin/centers/pending"),
    "Failed to fetch pending centers."
  )
}

export async function approveCenterAction(centerId: string): Promise<VoidResult> {
  const result = await callApiVoid(
    () =>
      springFetch(`/api/admin/centers/${centerId}/approve`, {
        method: "PATCH",
      }),
    "Failed to approve center."
  )

  if (!result.error) revalidatePath("/dashboard/verifications")

  return result
}

export async function rejectCenterAction(centerId: string): Promise<VoidResult> {
  const result = await callApiVoid(
    () =>
      springFetch(`/api/admin/centers/${centerId}/reject`, {
        method: "PATCH",
      }),
    "Failed to reject center."
  )

  if (!result.error) revalidatePath("/dashboard/verifications")

  return result
}
