import { create } from "zustand";
import type { SessionUser } from "@/types/session";

interface AuthState {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  clearUser: () => void;
}

/**
 * Client-side auth store.
 * Initialized by <AuthInitializer> in the dashboard layout
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
