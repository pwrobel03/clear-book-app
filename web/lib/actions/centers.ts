"use server"

import { revalidatePath } from "next/cache"

import { springFetch } from "@/lib/server/spring"
import { callApi, callApiVoid } from "@/lib/server/api-action"
import type {
  ActionResult,
  MedicalCenterResponse,
  MembershipResponse,
  MembershipRole,
  VoidResult,
} from "@/types/api"

export async function createCenterAction(data: {
  name: string
  description?: string
  address: string
  city: string
  phone?: string
  email?: string
  type: string
}): Promise<ActionResult<MedicalCenterResponse>> {
  const result = await callApi<MedicalCenterResponse>(
    () =>
      springFetch("/api/centers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    "Failed to create center."
  )

  if (!result.error) revalidatePath("/dashboard/centers")

  return result
}

export async function getMyCentersAction(): Promise<ActionResult<MembershipResponse[]>> {
  return callApi<MembershipResponse[]>(
    () => springFetch("/api/centers/my"),
    "Failed to fetch your centers."
  )
}

export async function acceptInvitationAction(membershipId: string): Promise<VoidResult> {
  const result = await callApiVoid(
    () =>
      springFetch(`/api/centers/memberships/${membershipId}/accept`, {
        method: "POST",
      }),
    "Failed to accept invitation."
  )

  if (!result.error) revalidatePath("/dashboard/centers")

  return result
}

export async function rejectInvitationAction(membershipId: string): Promise<VoidResult> {
  const result = await callApiVoid(
    () =>
      springFetch(`/api/centers/memberships/${membershipId}/reject`, {
        method: "POST",
      }),
    "Failed to reject invitation."
  )

  if (!result.error) revalidatePath("/dashboard/centers")

  return result
}

export async function inviteByCodeAction(
  centerId: string,
  inviteCode: string,
  role: MembershipRole = "MEMBER"
): Promise<ActionResult<MembershipResponse>> {
  return callApi<MembershipResponse>(
    () =>
      springFetch(`/api/centers/${centerId}/invite`, {
        method: "POST",
        body: JSON.stringify({ inviteCode, role }),
      }),
    "Failed to send invitation."
  )
}
