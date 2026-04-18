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
import {
  getInviteCodeAction,
  refreshInviteCodeAction,
} from "@/lib/actions/doctor";
import { GlassCard } from "@/components/ui/glass";
import { PageHeader } from "../page-header";

function InviteCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchCode() {
    setLoading(true);
    const result = await getInviteCodeAction();
    if (result.data) {
      setCode(result.data.code);
      setExpiresAt(result.data.expiresAt);
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    const result = await refreshInviteCodeAction();
    if (result.data) {
      setCode(result.data.code);
      setExpiresAt(result.data.expiresAt);
    }
    setRefreshing(false);
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
    <GlassCard className="p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner transition-transform group-hover:scale-110">
          <Key size={22} className="text-accent dark:text-accent-light" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground">
          Invite Code
        </span>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="h-10 w-48 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
        ) : (
          <p className="font-mono text-3xl font-black tracking-widest text-foreground">
            {code ?? "—"}
          </p>
        )}
        {expiryLabel && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock size={14} /> {expiryLabel}
          </p>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
        Share this code so a medical center can invite you.
      </p>

      <div className="mt-5 flex gap-3">
        <Button
          size="sm"
          onClick={handleCopy}
          disabled={!code || loading}
          className="gap-2 rounded-xl"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="gap-2 rounded-xl bg-secondary/50 backdrop-blur-sm hover:bg-secondary"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
    </GlassCard>
  );
}

const placeholderCards = [
  {
    icon: Calendar,
    label: "Today's Appointments",
    value: "—",
    sub: "No appointments today",
  },
  {
    icon: Building2,
    label: "Affiliated Centers",
    value: "—",
    sub: "No centers yet",
  },
];

export function DoctorDashboard({ user }: { user: SessionUser }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <PageHeader
          title={`Welcome, Dr. ${user.lastName}`}
          description="Manage your schedule, affiliated centers, and availability."
        />
        <div className="space-y-8 max-w-5xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {placeholderCards.map(({ icon: Icon, label, value, sub }) => (
              <GlassCard key={label} className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner transition-transform group-hover:scale-110">
                    <Icon
                      size={22}
                      className="text-accent dark:text-accent-light"
                    />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {label}
                  </span>
                </div>
                <p className="mt-5 text-4xl font-black text-foreground">
                  {value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
              </GlassCard>
            ))}
            <InviteCodeCard />
          </div>
        </div>
      </main>
    </div>
  );
}
