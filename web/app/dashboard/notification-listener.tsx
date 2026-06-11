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
let mountCount = 0; // track concurrent mounts to avoid premature disconnect

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
      // 10 s reconnect delay — short enough to recover quickly, long enough to
      // avoid hammering the server after a backend restart or deployment.
      reconnectDelay: 10000,
      // Heartbeat: 25 s matches the nginx/server idle timeout expectations.
      // 4 s was too aggressive through a TLS+nginx proxy and caused spurious drops.
      heartbeatIncoming: 25000,
      heartbeatOutgoing: 25000,
      onConnect: () => {
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
      onWebSocketError: () => {
        // Suppress the noisy browser console error on expected reconnects.
        // The client handles reconnection automatically via reconnectDelay.
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

async function disconnect(): Promise<void> {
  const client = stompClient;
  stompClient = null;
  if (client) {
    try {
      await client.deactivate();
    } catch {
      // "WebSocket is closed before the connection is established" is expected
      // when the component unmounts while a reconnection attempt is in flight.
      // Safe to ignore — the client is being torn down intentionally.
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GlobalNotificationListener() {
  useEffect(() => {
    mountCount++;
    ensureConnected();

    return () => {
      mountCount--;
      if (mountCount === 0) {
        disconnect();
      }
    };
  }, []);

  return null;
}
