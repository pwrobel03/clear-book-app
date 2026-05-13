"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth";
import { TestNotificationButton } from "@/app/dashboard/test-notification-button";

const roleLabel: Record<string, string> = {
  USER: "Patient",
  DOCTOR: "Doctor",
  ADMIN: "Admin",
  MANAGER: "Manager", // Dodano etykietę dla menedżera
};

interface DashboardHeaderProps {
  title?: string;
  description?: string; // Dodano opcjonalny opis
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="mx-6 mt-6 flex min-h-16 items-center justify-between rounded-2xl border border-white/20 border-t-white/40 bg-white/60 px-6 py-3 shadow-sm backdrop-blur-xl dark:border-white/5 dark:border-t-white/10 dark:bg-white/[0.04]">
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

      {/* Test Notification Button - Only visible in development environment */}
      {process.env.NODE_ENV === "development" && <TestNotificationButton />}

      <div className="flex items-center gap-3 shrink-0">
        {user && (
          <span className="text-xs font-medium text-muted-foreground hidden sm:block">
            {user.firstName} {user.lastName}
          </span>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
