"use client";

import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { toast } from "sonner";
import { getWsTokenAction } from "@/lib/actions/ws";
import { useNotificationStore } from "@/store/notification";

// ── Module-level singleton ────────────────────────────────────────────────────
// Keeping the STOMP client outside of React's render tree means that React
// Strict Mode's intentional double-mount (setup → cleanup → setup) in
// development does NOT create two simultaneous WebSocket connections.
// A single instance is shared across all mounts of this component.

let stompClient: Client | null = null;
let connectingPromise: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
  // Already active — nothing to do
  if (stompClient?.active) return;

  // Connection already in progress — wait for it
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    const token = await getWsTokenAction();
    if (!token) return; // Not authenticated

    await useNotificationStore.getState().fetchHistory();

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

    stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[STOMP] Connected.");
        stompClient!.subscribe("/user/queue/notifications", (message) => {
          const notification = JSON.parse(message.body);
          useNotificationStore.getState().addNotification(notification);
          toast.info(notification.title, {
            description: notification.message,
            duration: 8000,
          });
        });
      },
      onStompError: (frame) => {
        console.error("[STOMP] Broker error:", frame.headers["message"]);
      },
      onDisconnect: () => {
        stompClient = null;
      },
    });

    stompClient.activate();
  })().finally(() => {
    connectingPromise = null;
  });

  return connectingPromise;
}

function disconnect(): void {
  if (stompClient?.active) {
    stompClient.deactivate();
    stompClient = null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GlobalNotificationListener() {
  useEffect(() => {
    ensureConnected();
    return () => { disconnect(); };
  }, []);

  return null;
}
