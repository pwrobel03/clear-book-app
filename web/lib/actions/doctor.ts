"use server"

import { revalidatePath } from "next/cache"

import { springFetch } from "@/lib/server/spring"
import { callApi } from "@/lib/server/api-action"
import type {
  ActionResult,
  DoctorProfileResponse,
  InviteCodeResponse,
  SpecializationDto,
  SpringPage,
  MedicalCenterResponse
} from "@/types/api"

/**
 * Fetches the authenticated doctor's own profile.
 *
 * Kept as a custom handler because the 404 case is semantically meaningful
 * (no profile created yet → data: null) rather than an error.
 */
export async function getProfileAction(): Promise<
  ActionResult<DoctorProfileResponse | null>
> {
  try {
    const res = await springFetch("/api/doctors/me/profile")

    if (res.status === 403) return { error: "Access denied." }
    if (res.status === 404) return { data: null }

    const json = await res.json()
    if (!res.ok) return { error: json.message ?? "Failed to load profile." }

    return { data: json as DoctorProfileResponse }
  } catch {
    return { error: "Service unavailable. Please try again later." }
  }
}

export async function getSpecializationsAction(): Promise<ActionResult<SpecializationDto[]>> {
  return callApi<SpecializationDto[]>(
    () => springFetch("/api/specializations"),
    "Failed to load specializations."
  )
}

export async function upsertProfileAction(data: {
  specializations: string[]
  bio?: string
  licenseNumber?: string
  isPublic: boolean
}): Promise<ActionResult<DoctorProfileResponse>> {
  const result = await callApi<DoctorProfileResponse>(
    () =>
      springFetch("/api/doctors/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          specializations: data.specializations,
          bio: data.bio,
          licenseNumber: data.licenseNumber,
          public: data.isPublic,
        }),
      }),
    "Failed to save profile."
  )

  if (!result.error) revalidatePath("/dashboard/profile")

  return result
}

export async function getInviteCodeAction(): Promise<ActionResult<InviteCodeResponse>> {
  return callApi<InviteCodeResponse>(
    () => springFetch("/api/users/me/invite-code"),
    "Failed to load invite code."
  )
}

export async function refreshInviteCodeAction(): Promise<ActionResult<InviteCodeResponse>> {
  return callApi<InviteCodeResponse>(
    () =>
      springFetch("/api/users/me/invite-code/refresh", {
        method: "POST",
      }),
    "Failed to refresh invite code."
  )
}

export async function getDoctorsAction(specialization?: string, city?: string): Promise<SpringPage<DoctorProfileResponse>> {
  const params = new URLSearchParams({ size: "12" });
  if (specialization) params.set("specialization", specialization);
  if (city) params.set("city", city);

  try {
    const res = await springFetch(`/api/doctors?${params}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch doctors");
    return res.json();
  } catch (error) {
    // Prawidłowy pusty fallback SpringPage
    return { content: [], totalElements: 0, totalPages: 0, size: 12, number: 0 };
  }
}

/**
 * Fetches the public list of medical centers a doctor is affiliated with.
 * Returns an empty array if the doctor has no centers or if an error occurs,
 * to easily render the public profile without throwing exceptions.
 */
export async function getDoctorAffiliatedCentersAction(publicId: string): Promise<MedicalCenterResponse[]> {
  try {
    const res = await springFetch(`/api/doctors/${publicId}/centers`, { 
      cache: "no-store" // Zawsze aktualne dane
    });
    
    if (!res.ok) {
      return [];
    }
    
    return await res.json() as MedicalCenterResponse[];
  } catch (error) {
    console.error(`Failed to fetch affiliated centers for doctor ${publicId}:`, error);
    return [];
  }
}

export async function getDoctorByPublicIdAction(publicId: string): Promise<ActionResult<DoctorProfileResponse>> {
  return callApi<DoctorProfileResponse>(
    () => springFetch(`/api/doctors/${publicId}`, { cache: "no-store" }),
    "Failed to load doctor profile."
  );
}