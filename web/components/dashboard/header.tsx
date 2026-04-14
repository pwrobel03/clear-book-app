"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth";

const roleLabel: Record<string, string> = {
  USER: "Patient",
  DOCTOR: "Doctor",
  ADMIN: "Administrator",
};

export function DashboardHeader({ title }: { title?: string }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-sm font-semibold text-foreground">
        {title ?? (user ? `${roleLabel[user.role] ?? user.role} Dashboard` : "Dashboard")}
      </h1>
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-xs text-muted-foreground">
            {user.firstName} {user.lastName}
          </span>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
