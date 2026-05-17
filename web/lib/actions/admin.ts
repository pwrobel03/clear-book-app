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

export async function getVerificationDocumentAction(
  fileName: string
): Promise<ActionResult<{ base64: string; mimeType: string }>> {
  try {
    const res = await springFetch(`/api/verification/document/${fileName}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.message ?? "Nie udało się pobrać dokumentu." };
    }

    // Getting the MIME type from the response headers, defaulting to application/octet-stream if not provided
    const mimeType = res.headers.get("content-type") || "application/octet-stream";
    
    // Getting the file as an ArrayBuffer and converting it to a Base64 string
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return { data: { base64, mimeType } };
  } catch (error) {
    console.error("Error fetching document:", error);
    return { error: "Server error while fetching document." };
  }
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
