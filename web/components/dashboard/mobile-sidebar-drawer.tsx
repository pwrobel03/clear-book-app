"use client";

import { useEffect } from "react";
import { useSidebarStore } from "@/store/sidebar";
import { Sidebar } from "./sidebar";

/**
 * Mobile-only slide-in sidebar drawer.
 * Rendered once in DashboardLayout — invisible on md+ screens.
 * Opens/closes via the global useSidebarStore.
 */
export function MobileSidebarDrawer() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const close = useSidebarStore((s) => s.close);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={[
          "md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Drawer panel */}
      <div
        className={[
          "md:hidden fixed inset-y-0 left-0 z-50 flex flex-col p-3",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <Sidebar onNavigate={close} />
      </div>
    </>
  );
}
