"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Building2,
  Key,
  RefreshCw,
  Copy,
  Check,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/types/session";

// ─── Invite Code Card ─────────────────────────────────────────────────────────

function InviteCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchCode() {
    try {
      const res = await fetch("/api/users/me/invite-code");
      if (res.ok) {
        const data = await res.json();
        setCode(data.code);
        setExpiresAt(data.expiresAt);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/users/me/invite-code/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCode(data.code);
        setExpiresAt(data.expiresAt);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    fetchCode();
  }, []);

  const expiryLabel = expiresAt
    ? `Expires ${new Date(expiresAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
          <Key size={18} className="text-accent" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Invite Code
        </span>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        ) : (
          <p className="font-mono text-2xl font-bold tracking-widest text-foreground">
            {code ?? "—"}
          </p>
        )}
        {expiryLabel && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={11} />
            {expiryLabel}
          </p>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Share this code so a medical center can invite you. Valid for 72 hours.
      </p>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          onClick={handleCopy}
          disabled={!code || loading}
          className="gap-1.5"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="gap-1.5"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
    </div>
  );
}

// ─── Doctor Dashboard ─────────────────────────────────────────────────────────

const placeholderCards = [
  { icon: Calendar, label: "Today's Appointments", value: "—", sub: "No appointments today" },
  { icon: Building2, label: "Affiliated Centers", value: "—", sub: "No centers yet" },
];

export function DoctorDashboard({ user }: { user: SessionUser }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome, Dr. {user.lastName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your schedule, affiliated centers, and availability.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderCards.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <Icon size={18} className="text-accent" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}

        <InviteCodeCard />
      </div>
    </div>
  );
}
