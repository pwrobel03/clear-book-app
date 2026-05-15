"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import {
  LayoutDashboard,
  Calendar,
  Stethoscope,
  Building2,
  Key,
  Users,
  ShieldCheck,
  User,
  LogOut,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useSidebarStore } from "@/store/sidebar";
import type { UserRole } from "@/types/session";
import { SidebarNotifications } from "./sidebard-notifications";

// ─── Nav config ───────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  soon?: boolean;
  onClick?: () => void;
};

const navByRole: Record<UserRole, NavItem[]> = {
  USER: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    {
      href: "/dashboard/appointments",
      icon: Calendar,
      label: "Appointments",
    },
    {
      href: "/doctors",
      icon: Stethoscope,
      label: "Find a Doctor",
    },
    { href: "/centers", icon: Building2, label: "Medical Centers" },
    { href: "/dashboard/profile", icon: User, label: "Profile", soon: true },
  ],
  DOCTOR: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    {
      href: "/dashboard/schedule",
      icon: Calendar,
      label: "My Schedule",
    },
    {
      href: "/dashboard/appointments",
      icon: Calendar,
      label: "Appointments",
    },
    {
      label: "Services",
      href: "/dashboard/services",
      icon: Stethoscope,
    },
    { href: "/dashboard/centers", icon: Building2, label: "My Centers" },
    { href: "/dashboard/invite", icon: Key, label: "Invite Code" },
    { href: "/dashboard/reports", icon: BarChart2, label: "Reports" },
    { href: "/dashboard/profile", icon: User, label: "Profile" },
  ],
  ADMIN: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    {
      href: "/dashboard/verifications",
      icon: ShieldCheck,
      label: "Verifications",
    },
    { href: "/dashboard/users", icon: Users, label: "Users", soon: true },
    {
      href: "/dashboard/centers",
      icon: Building2,
      label: "Centers",
      soon: true,
    },
  ],
  MANAGER: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/centers", icon: Building2, label: "My Centers" },
    { href: "/dashboard/profile", icon: User, label: "Profile", soon: true },
  ],
};

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ item, active }: { item: NavItem; active: boolean }) {
  const content = (
    <span
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-white/15 text-white"
          : "text-white/60 hover:bg-white/10 hover:text-white",
        item.soon && "cursor-not-allowed opacity-50",
      )}
    >
      <item.icon size={16} className="shrink-0" />
      {item.label}
      {item.soon && (
        <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] leading-none text-white/60">
          Soon
        </span>
      )}
    </span>
  );

  if (item.soon) return <div>{content}</div>;
  return <Link href={item.href} onClick={item.onClick}>{content}</Link>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  /** Called after a nav link is clicked — used to close the mobile drawer */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);

  if (!user) return null;

  // Inject the close callback into every nav item
  const nav: NavItem[] = (navByRole[user.role] ?? []).map((item) => ({
    ...item,
    onClick: onNavigate,
  }));

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  async function handleLogout() {
    onNavigate?.();
    clearUser();
    await logoutAction();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-3xl bg-primary-dark shadow-glass">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="text-xs font-black text-white">CB</span>
        </div>
        <span className="text-sm font-bold text-white">ClearBook</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {nav.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            }
          />
        ))}
        <SidebarNotifications />
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-white/50">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
