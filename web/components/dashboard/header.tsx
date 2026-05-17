"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth";
import { useSidebarStore } from "@/store/sidebar";
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
  const openSidebar = useSidebarStore((s) => s.open);

  return (
    <header className="mx-4 md:mx-6 my-4 md:my-6 flex min-h-16 items-center justify-between rounded-2xl border border-white/20 border-t-white/40 bg-white/60 px-4 md:px-6 py-3 shadow-sm backdrop-blur-xl dark:border-white/5 dark:border-t-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={openSidebar}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

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
      </div>

      {/* Test Notification Button - Only visible in development environment */}
      {/* {process.env.NODE_ENV === "development" && <TestNotificationButton />} */}

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
