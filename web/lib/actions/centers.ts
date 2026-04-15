"use server";

import { springFetch } from "@/lib/server/spring";
import { revalidatePath } from "next/cache";

export async function createCenterAction(data: {
  name: string;
  description?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  type: string;
}) {
  try {
    const res = await springFetch("/api/centers", {
      method: "POST",
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) return { error: json.message ?? "Failed to create center." };

    revalidatePath("/dashboard/centers");
    return { data: json };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function acceptInvitationAction(membershipId: string) {
  try {
    const res = await springFetch(
      `/api/centers/memberships/${membershipId}/accept`,
      { method: "POST" }
    );

    if (!res.ok) {
      const json = await res.json();
      return { error: json.message ?? "Failed to accept invitation." };
    }

    revalidatePath("/dashboard/centers");
    return { success: true };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function getMyCentersAction() {
  try {
    const res = await springFetch("/api/centers/my");
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { error: json.message ?? "Failed to fetch centers." };
    }
    return { data: await res.json() };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function rejectInvitationAction(membershipId: string) {
  try {
    const res = await springFetch(
      `/api/centers/memberships/${membershipId}/reject`,
      { method: "POST" }
    );

    if (!res.ok) {
      const json = await res.json();
      return { error: json.message ?? "Failed to reject invitation." };
    }

    revalidatePath("/dashboard/centers");
    return { success: true };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function inviteByCodeAction(
  centerId: string,
  inviteCode: string,
  role: string = "MEMBER"
) {
  try {
    const res = await springFetch(`/api/centers/${centerId}/invite`, {
      method: "POST",
      body: JSON.stringify({ inviteCode, role }),
    });

    const json = await res.json();
    if (!res.ok) return { error: json.message ?? "Failed to send invitation." };

    return { data: json };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}
