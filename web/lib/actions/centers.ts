"use server"

import { revalidatePath } from "next/cache"

import { springFetch } from "@/lib/server/spring"
import { callApi, callApiVoid } from "@/lib/server/api-action"
import type { 
  MedicalCenterResponse, 
  SpringPage, 
  MembershipResponse,
  ActionResult,
  MembershipRole,
  VoidResult,
  CenterMemberSummary,
} from "@/types/api";

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

export async function getCentersAction(city?: string): Promise<SpringPage<MedicalCenterResponse>> {
  const params = new URLSearchParams({ size: "24" });
  if (city) params.set("city", city);

  try {
    const res = await springFetch(`/api/centers?${params}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch centers");
    return res.json();
  } catch (error) {
    // Zwracamy pusty wynik w przypadku błędu (np. gdy backend leży)
    return { content: [], totalElements: 0, totalPages: 0, size: 24, number: 0 };
  }
}

export async function getCenterByIdAction(id: string): Promise<MedicalCenterResponse | null> {
  const res = await springFetch(`/api/centers/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function getCenterMembersAction(id: string): Promise<CenterMemberSummary[]> {
  const res = await springFetch(`/api/centers/${id}/members`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function getMyCentersAction(): Promise<ActionResult<MembershipResponse[]>> {
  return callApi<MembershipResponse[]>(
    () => springFetch("/api/centers/my", { cache: "no-store" }),
    "Failed to fetch your centers."
  );
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
): Promise<ActionResult<MedicalCenterResponse>> {
  return callApi<MedicalCenterResponse>(
    () =>
      springFetch(`/api/centers/${centerId}/invite`, {
        method: "POST",
        body: JSON.stringify({ inviteCode, role }),
      }),
    "Failed to send invitation."
  )
}
