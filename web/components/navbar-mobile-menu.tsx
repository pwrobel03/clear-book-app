"use client";

import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Building2,
  Stethoscope,
  LayoutDashboard,
  LogIn,
  LogOut,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { BrandLogo } from "./ui/brand-logo";

interface NavbarMobileMenuProps {
  isAuth: boolean;
}

export function NavbarMobileMenu({ isAuth }: NavbarMobileMenuProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Otwórz menu nawigacyjne"
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted"
      >
        <Menu size={18} />
      </button>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={[
          "md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Slide-in panel from the right */}
      <div
        className={[
          "md:hidden fixed inset-y-0 right-0 z-50 flex w-72 flex-col",
          "bg-card border-l border-border shadow-xl",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BrandLogo size={24} />
            <span className="font-bold text-foreground text-sm">ClearBook</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Zamknij menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1 p-4 flex-1">
          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Explore
          </p>
          <Link
            href="/centers"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Building2 size={16} />
            Centers
          </Link>
          <Link
            href="/doctors"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Stethoscope size={16} />
            Find a Doctor
          </Link>

          {isAuth && (
            <>
              <div className="my-2 h-px bg-border" />
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                Your account
              </p>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LayoutDashboard size={16} />
                Go to Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Footer — auth actions */}
        <div className="p-4 border-t border-border">
          {isAuth ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} />
                Log out
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <LogIn size={15} />
                Sign in
              </Link>
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-dark transition-colors"
              >
                <UserPlus size={15} />
                Register now
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
