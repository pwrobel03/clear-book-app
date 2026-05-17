"use client";

import { useState } from "react";
import { toast } from "sonner";
import { triggerTestNotificationAction } from "@/lib/actions/ws";

export function TestNotificationButton() {
  const [loading, setLoading] = useState(false);

  const triggerNotification = async () => {
    setLoading(true);
    try {
      const result = await triggerTestNotificationAction();
      if (result?.error) {
        toast.error(result.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={triggerNotification}
      disabled={loading}
      className="px-4 py-2 text-accent rounded-md shadow disabled:opacity-50"
    >
      Send Test Notification
    </button>
  );
}
