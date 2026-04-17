"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import type { SessionUser } from "@/types/session";

/**
 * Invisible client component that seeds the Zustand store
 * with user data fetched server-side in the dashboard layout.
 */
export function AuthInitializer({ user }: { user: SessionUser }) {
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return null;
}
