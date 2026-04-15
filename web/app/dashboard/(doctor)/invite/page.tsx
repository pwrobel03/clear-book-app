"use client";

import { useEffect, useState } from "react";
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Loader2,
  Building2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/header";
import { refreshInviteCodeAction, getInviteCodeAction } from "@/lib/actions/doctor";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type InviteCode = {
  code: string;
  expiresAt: string;
};

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "1",
    title: "Share your code",
    description:
      "Send your invite code to a medical center administrator via email, phone, or messaging app.",
  },
  {
    n: "2",
    title: "Center sends invitation",
    description:
      "The administrator enters your code in their centers panel. An invitation appears in your account.",
  },
  {
    n: "3",
    title: "Accept or reject",
    description: "Review the invitation in My Centers and choose to join or decline.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvitePage() {
  const [data, setData] = useState<InviteCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchCode() {
    const result = await getInviteCodeAction();
    if (!("error" in result)) setData(result.data);
  }

  useEffect(() => {
    fetchCode().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    const result = await refreshInviteCodeAction();
    if (!("error" in result)) setData(result.data);
    setRefreshing(false);
  }

  async function handleCopy() {
    if (!data) return;
    await navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const expiresLabel = data
    ? `Expires ${new Date(data.expiresAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : null;

  const hoursLeft = data
    ? Math.round((new Date(data.expiresAt).getTime() - Date.now()) / 3600000)
    : null;

  const isExpiringSoon = hoursLeft !== null && hoursLeft < 12;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Invite Code" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-8">

          {/* Code card */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Key size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Your Invite Code</h2>
                <p className="text-sm text-muted-foreground">
                  Share this with medical centers to receive affiliation invitations.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Code display */}
                <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 px-6 py-5 text-center">
                  <p className="font-mono text-3xl font-bold tracking-[0.25em] text-foreground">
                    {data?.code ?? "—"}
                  </p>
                </div>

                {/* Expiry */}
                {expiresLabel && (
                  <p
                    className={`mt-3 flex items-center justify-center gap-1.5 text-sm ${
                      isExpiringSoon ? "text-warning" : "text-muted-foreground"
                    }`}
                  >
                    <Clock size={13} />
                    {expiresLabel}
                    {isExpiringSoon && (
                      <span className="font-medium"> — expiring soon</span>
                    )}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-5 flex gap-3 justify-center">
                  <Button onClick={handleCopy} disabled={!data} className="gap-2">
                    {copied ? (
                      <>
                        <Check size={15} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={15} /> Copy Code
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2"
                  >
                    <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing…" : "Refresh Code"}
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Refreshing generates a new code and immediately invalidates the current one.
                </p>
              </>
            )}
          </div>

          {/* How it works */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="font-bold text-foreground mb-5">How it works</h3>
            <div className="space-y-5">
              {STEPS.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {step.n}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link to centers */}
          <Link
            href="/dashboard/centers"
            className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                View pending invitations in My Centers
              </span>
            </div>
            <ArrowRight size={16} className="text-muted-foreground" />
          </Link>
        </div>
      </main>
    </div>
  );
}
