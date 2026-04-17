"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth";

const roleLabel: Record<string, string> = {
  USER: "Patient",
  DOCTOR: "Doctor",
  ADMIN: "Administrator",
  MANAGER: "Manager", // Dodano etykietę dla menedżera
};

interface DashboardHeaderProps {
  title?: string;
  description?: string; // Dodano opcjonalny opis
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex flex-col justify-center">
        <h1 className="text-sm font-semibold text-foreground">
          {title ??
            (user
              ? `${roleLabel[user.role] ?? user.role} Dashboard`
              : "Dashboard")}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

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
