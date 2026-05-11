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
import {
  refreshInviteCodeAction,
  getInviteCodeAction,
} from "@/lib/actions/doctor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // IMPORT TOAST
import { GlassCard, GlassPanel } from "@/components/ui/glass";

// TODO: This page is currently just a simple interface to show the doctor's invite code and let them refresh it. In the future, we might want to add more features to it (like showing recent invitations, letting doctor manage them, etc.) but for now it's just a simple page to get the invite code and refresh it.

// TODO: We should also add some kind of notification system to notify doctor when they receive a new invitation, but for now they will have to check the "My Centers" page manually to see if they received any new invitations.

type InviteCode = { code: string; expiresAt: string };
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
    description:
      "Review the invitation in My Centers and choose to join or decline.",
  },
];

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
    if ("error" in result) toast.error(result.error);
    else {
      setData(result.data);
      toast.success("Invite code refreshed successfully.");
    }
    setRefreshing(false);
  }

  async function handleCopy() {
    if (!data) return;
    await navigator.clipboard.writeText(data.code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  const expiresLabel = data
    ? `Expires ${new Date(data.expiresAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : null;
  const hoursLeft = data
    ? Math.round((new Date(data.expiresAt).getTime() - Date.now()) / 3600000)
    : null;
  const isExpiringSoon = hoursLeft !== null && hoursLeft < 12;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Invite Code" />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="mx-auto max-w-2xl space-y-8">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner">
                <Key size={26} className="text-accent dark:text-accent-light" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Your Invite Code
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Share this with medical centers to receive affiliation
                  invitations.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  size={32}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : (
              <>
                <div className="rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 dark:bg-accent/10 px-8 py-6 text-center shadow-inner">
                  <p className="font-mono text-4xl font-black tracking-[0.2em] text-foreground">
                    {data?.code ?? "—"}
                  </p>
                </div>
                {expiresLabel && (
                  <p
                    className={`mt-4 flex items-center justify-center gap-2 text-sm font-medium ${isExpiringSoon ? "text-warning" : "text-muted-foreground"}`}
                  >
                    <Clock size={16} /> {expiresLabel}{" "}
                    {isExpiringSoon && <span>— expiring soon</span>}
                  </p>
                )}
                <div className="mt-8 flex gap-4 justify-center">
                  <Button
                    onClick={handleCopy}
                    disabled={!data}
                    className="gap-2 rounded-xl h-12 px-8 text-base shadow-md"
                  >
                    {copied ? (
                      <>
                        <Check size={18} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} /> Copy Code
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="gap-2 rounded-xl h-12 px-8 text-base bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 backdrop-blur-md"
                  >
                    <RefreshCw
                      size={18}
                      className={refreshing ? "animate-spin" : ""}
                    />{" "}
                    {refreshing ? "Refreshing…" : "Refresh Code"}
                  </Button>
                </div>
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Refreshing generates a new code and immediately invalidates
                  the current one.
                </p>
              </>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-6">
              How it works
            </h3>
            <div className="space-y-6">
              {STEPS.map((step) => (
                <div key={step.n} className="flex gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 shadow-inner text-sm font-black text-primary dark:text-primary-light">
                    {step.n}
                  </div>
                  <div className="pt-1">
                    <p className="text-base font-bold text-foreground">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <Link
              href="/dashboard/centers"
              className={`flex items-center justify-between !p-5`}
            >
              <div className="flex items-center gap-4">
                <Building2
                  size={20}
                  className="text-muted-foreground group-hover:text-accent transition-colors"
                />
                <span className="text-base font-bold text-foreground">
                  View pending invitations in My Centers
                </span>
              </div>
              <ArrowRight
                size={20}
                className="text-muted-foreground group-hover:translate-x-1 group-hover:text-accent transition-all"
              />
            </Link>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
