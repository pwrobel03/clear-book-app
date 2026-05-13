"use server"

import { cookies } from "next/headers";
import { springFetch } from "@/lib/server/spring";

export async function getWsTokenAction(): Promise<string | null> {
  const store = await cookies();
  return store.get("clearbook_token")?.value || null;
}

export async function triggerTestNotificationAction() {
  try {
    const res = await springFetch("/api/test/notify", { 
      method: "POST" 
    });

    if (!res.ok) {
      return { error: "Błąd podczas wysyłania powiadomienia" };
    }

    return { success: true };
  } catch (error) {
    console.error("Test notification action error:", error);
    return { error: "Wystąpił błąd po stronie serwera" };
  }
}