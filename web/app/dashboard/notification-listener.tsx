"use client";

import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { toast } from "sonner";
import { getWsTokenAction } from "@/lib/actions/ws";
import { useNotificationStore } from "@/store/notification";

// ── Module-level singleton ────────────────────────────────────────────────────
// Keeping the STOMP client outside React's render tree prevents React Strict
// Mode's intentional double-mount from creating two simultaneous connections.

let stompClient: Client | null = null;
let connectingPromise: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
  // Already active — nothing to do
  if (stompClient?.active) return;

  // Connection already in progress — piggyback on it
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    const token = await getWsTokenAction();
    if (!token) return; // Not authenticated

    await useNotificationStore.getState().fetchHistory();

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

    // Keep a reference to THIS client instance so onDisconnect can compare it
    // against the singleton before clearing — avoiding a race condition where
    // the old client's onDisconnect fires after a new client has already been
    // assigned to `stompClient`, which would wipe out the new live connection.
    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      // 10 s reconnect delay — recovers quickly without hammering the server.
      reconnectDelay: 10000,
      // 25 s heartbeats are more tolerant of TLS + nginx proxy latency than
      // the previous 4 s setting, which caused spurious connection drops.
      heartbeatIncoming: 25000,
      heartbeatOutgoing: 25000,
      onConnect: () => {
        client.subscribe("/user/queue/notifications", (message) => {
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
        // Only clear the singleton if THIS client is still the active one.
        // If disconnect() was called and a new client was already created
        // before onDisconnect fires, we must NOT overwrite that new reference.
        if (stompClient === client) {
          stompClient = null;
        }
      },
    });

    stompClient = client;
    client.activate();
  })().finally(() => {
    connectingPromise = null;
  });

  return connectingPromise;
}

function disconnect(): void {
  const client = stompClient;
  // Clear the singleton immediately so ensureConnected() can create a fresh
  // client if the component remounts before deactivate() completes.
  stompClient = null;
  // deactivate() is async internally; errors here are expected when the
  // component unmounts while a reconnection attempt is still in flight.
  client?.deactivate().catch(() => { /* intentional unmount — safe to ignore */ });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GlobalNotificationListener() {
  useEffect(() => {
    ensureConnected();
    return () => { disconnect(); };
  }, []);

  return null;
}
