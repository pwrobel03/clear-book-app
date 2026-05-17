"use client";

import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { toast } from "sonner";
import { getWsTokenAction } from "@/lib/actions/ws";
import { useNotificationStore } from "@/store/notification";

export function GlobalNotificationListener() {
  const clientRef = useRef<Client | null>(null);
  const isConnected = useRef(false);

  useEffect(() => {
    if (isConnected.current) return;

    const connectWebSocket = async () => {
      // Check if already connected (in case of multiple mounts)
      const token = await getWsTokenAction();
      if (!token) return; // Niezalogowany

      // Getting notifications history before connecting to ensure we have the latest data and avoid duplicates from WebSocket
      await useNotificationStore.getState().fetchHistory();

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

      const client = new Client({
        brokerURL: wsUrl,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("[STOMP] Połączono w czasie rzeczywistym!");

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
          console.error("[STOMP] Błąd brokera:", frame.headers["message"]);
        },
      });

      client.activate();
      clientRef.current = client;
      isConnected.current = true;
    };

    connectWebSocket();

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        isConnected.current = false;
      }
    };
  }, []);

  return null;
}
