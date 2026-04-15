"use server";

import { springFetch } from "@/lib/server/spring";
import { revalidatePath } from "next/cache";

export async function upsertProfileAction(data: {
  specializations: string[];
  bio?: string;
  licenseNumber?: string;
  isPublic: boolean;
}) {
  try {
    const res = await springFetch("/api/doctors/me/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) return { error: json.message ?? "Failed to save profile." };

    revalidatePath("/dashboard/profile");
    return { data: json };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function refreshInviteCodeAction() {
  try {
    const res = await springFetch("/api/users/me/invite-code/refresh", {
      method: "POST",
    });

    const json = await res.json();
    if (!res.ok) return { error: json.message ?? "Failed to refresh code." };

    return { data: json };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function getInviteCodeAction() {
  try {
    const res = await springFetch("/api/users/me/invite-code");
    const json = await res.json();
    if (!res.ok) return { error: json.message ?? "Failed to load code." };
    return { data: json };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}
