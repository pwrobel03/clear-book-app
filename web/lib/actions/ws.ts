"use server"

import { cookies } from "next/headers";
import { springFetch } from "@/lib/server/spring";
import { NotificationDto } from "@/types/notification";

/**
 * Returns the access token so the STOMP client can authenticate the WebSocket handshake.
 *
 * Security note: this moves the JWT from the HttpOnly cookie into browser memory.
 * An XSS attacker who can run arbitrary JS could call this action and obtain the token —
 * the same way they could call any other Server Action. The token already has a short
 * lifetime (15 min), which limits the damage window.
 *
 * TODO: Replace with a dedicated short-lived (≤30 s) WebSocket-only token issued by Spring
 *       (POST /api/auth/ws-token). The main JWT would never leave the HttpOnly cookie and
 *       the WS token would be useless outside the WebSocket handshake.
 */
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