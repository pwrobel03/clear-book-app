"use client";

import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { getWsTokenAction } from "@/lib/actions/ws";
import { useNotificationStore } from "@/store/notification";

export function GlobalNotificationListener() {
  const user = useAuthStore((s) => s.user);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    // If there's no user, we shouldn't even attempt to connect to WebSocket
    if (!user) return;

    const connectWebSocket = async () => {
      // Get the current access token from cookies via a Server Action
      const token = await getWsTokenAction();
      if (!token) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

      const client = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          // console.log("[STOMP] Connected in real-time!");

          // Listen to our dedicated, secured channel
          client.subscribe("/user/queue/notifications", (message) => {
            const notification = JSON.parse(message.body);

            // Display a beautiful Toast notification on the screen!
            toast.info(notification.title, {
              description: notification.message,
              duration: 8000, // Stays for 8 seconds so the doctor notices
            });

            useNotificationStore.getState().addNotification(notification);

            // In the future, we'll add: setUnreadCount(prev => prev + 1);
          });
        },
        onStompError: (frame) => {
          console.error("[STOMP] Broker error:", frame.headers["message"]);
        },
      });

      client.activate();
      clientRef.current = client;
    };

    connectWebSocket();

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [user]);

  return null;
}
