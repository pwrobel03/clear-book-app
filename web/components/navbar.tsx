import Link from "next/link";
import { getServerSession } from "@/lib/server/session";
import { TestNotificationButton } from "@/app/dashboard/test-notification-button";
import { NotificationBell } from "./dashboard/notification-bell";
import { ThemeToggle } from "./theme-toggle";

export async function Navbar() {
  const session = await getServerSession();
  const isAuth = !!session;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-black text-primary-foreground">
              CB
            </span>
          </div>
          <span className="font-bold text-foreground">ClearBook</span>
        </Link>

        {/* Linki i akcje */}
        <div className="flex items-center gap-5">
          <Link
            href="/centers"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Centers
          </Link>
          <Link
            href="/doctors"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Find a Doctor
          </Link>

          <div className="hidden h-4 w-px bg-border sm:block" />

          {isAuth ? (
            <div className="flex items-center gap-3">
              {/* Test Notification Button - Only visible in development environment */}
              {/* {process.env.NODE_ENV === "development" && (
                <TestNotificationButton />
              )} */}

              <NotificationBell />
              <ThemeToggle />

              <Link
                href="/dashboard"
                className="ml-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/auth"
                className="text-sm font-medium text-accent hover:underline"
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="hidden rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark sm:inline-flex"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
