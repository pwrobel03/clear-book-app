import Link from "next/link";
import { LogOut } from "lucide-react";
import { getServerSession } from "@/lib/server/session";
import { logoutAction } from "@/lib/actions/auth";
import { NotificationBell } from "./dashboard/notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { BrandLogo } from "./ui/brand-logo";
import { NavbarMobileMenu } from "./navbar-mobile-menu";

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
          <BrandLogo size={32} />
          <span className="font-bold text-foreground">ClearBook</span>
        </Link>

        {/* ── Desktop nav (sm+) ───────────────────────────────── */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/centers"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Centers
          </Link>
          <Link
            href="/doctors"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Find a Doctor
          </Link>

          <div className="h-4 w-px bg-border" />

          {isAuth ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <ThemeToggle />
              <Link
                href="/dashboard"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark"
              >
                Go to Dashboard
              </Link>
              {/* Logout — desktop */}
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Wyloguj się"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                >
                  <LogOut size={15} />
                </button>
              </form>
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
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-dark"
              >
                Register now
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile: theme + bell + hamburger ────────────────── */}
        <div className="flex md:hidden items-center gap-2">
          {isAuth && <NotificationBell />}
          <ThemeToggle />
          <NavbarMobileMenu isAuth={isAuth} />
        </div>
      </div>
    </header>
  );
}
