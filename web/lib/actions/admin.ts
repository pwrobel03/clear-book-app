"use server";

import { springFetch } from "@/lib/server/spring";
import { revalidatePath } from "next/cache";

export async function verifyDoctorAction(userId: string, action: "APPROVE" | "REJECT") {
  try {
    const res = await springFetch(`/api/admin/doctors/${userId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const json = await res.json();
      return { error: json.message ?? "Failed to verify doctor." };
    }

    revalidatePath("/dashboard/verifications");
    return { success: true };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function getPendingDoctorsAction() {
  try {
    const res = await springFetch("/api/admin/doctors/pending");
    if (!res.ok) return { error: "Failed to fetch doctors" };
    return { data: await res.json() };
  } catch {
    return { error: "Service unavailable" };
  }
}

export async function getPendingCentersAction() {
  try {
    const res = await springFetch("/api/admin/centers/pending");
    if (!res.ok) return { error: "Failed to fetch centers" };
    return { data: await res.json() };
  } catch {
    return { error: "Service unavailable" };
  }
}

export async function approveCenterAction(centerId: string) {
  try {
    const res = await springFetch(`/api/admin/centers/${centerId}/approve`, {
      method: "PATCH",
    });

    if (!res.ok) {
      const json = await res.json();
      return { error: json.message ?? "Failed to approve center." };
    }

    revalidatePath("/dashboard/verifications");
    return { success: true };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function rejectCenterAction(centerId: string) {
  try {
    const res = await springFetch(`/api/admin/centers/${centerId}/reject`, {
      method: "PATCH",
    });

    if (!res.ok) {
      const json = await res.json();
      return { error: json.message ?? "Failed to reject center." };
    }

    revalidatePath("/dashboard/verifications");
    return { success: true };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}
