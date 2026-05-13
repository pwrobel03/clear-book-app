"use server"

import { cookies } from "next/headers";
import { springFetch } from "@/lib/server/spring";
import { NotificationDto } from "@/types/notification";

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

export async function getNotificationsAction(size = 15): Promise<NotificationDto[]> {
  try {
    const res = await springFetch(`/api/notifications?size=${size}`, {
      cache: "no-store"
    });
    
    if (res.ok) {
      const data = await res.json();
      return data.content || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function markNotificationsAsReadAction(): Promise<boolean> {
  try {
    const res = await springFetch("/api/notifications/read", { 
      method: "PUT" 
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return false;
  }
}