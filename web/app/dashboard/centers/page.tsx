"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  ShieldCheck,
  Clock,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import type { MembershipResponse } from "@/types/api";
import {
  createCenterAction,
  acceptInvitationAction,
  rejectInvitationAction,
  getMyCentersAction,
} from "@/lib/actions/centers";
import type { CreateCenterData } from "@/lib/schemas/center";
import { CenterForm } from "@/components/centers/center-form";
import { GlassCard, GlassPanel } from "@/components/ui/glass";

function CreateCenterFormWrapper({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);

  async function handleCreate(values: CreateCenterData) {
    const result = await createCenterAction(values);
    if (result && "error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    toast.success("Center registered successfully. Pending approval.");
    onCreated();
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 rounded-2xl h-12 shadow-md"
      >
        <Plus size={18} />
        Register a Center
      </Button>
    );
  }

  return (
    <GlassPanel className="p-6 mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">
          Register a Medical Center
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
      <CenterForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
    </GlassPanel>
  );
}

function MembershipCard({
  membership,
  onAccept,
  onReject,
}: {
  membership: MembershipResponse;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isPending = membership.status === "INVITED";
  const roleLabel = membership.role === "ADMIN" ? "Administrator" : "Member";

  return (
    <GlassCard
      className={cn(
        "p-6",
        isPending &&
          "border-warning/50 dark:border-warning/30 bg-warning/5 dark:bg-warning/5",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110",
              isPending ? "bg-warning/20" : "bg-primary/10 dark:bg-primary/20",
            )}
          >
            <Building2
              size={22}
              className={
                isPending
                  ? "text-warning"
                  : "text-primary dark:text-primary-light"
              }
            />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {membership.centerName}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <MapPin size={14} /> {membership.centerCity}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant={membership.role === "ADMIN" ? "default" : "muted"}>
            {membership.role === "ADMIN" && (
              <ShieldCheck size={12} className="mr-1" />
            )}
            {roleLabel}
          </Badge>
          {isPending ? (
            <Badge variant="warning">
              <Clock size={10} className="mr-1" /> Invited
            </Badge>
          ) : (
            <Badge
              variant={
                membership.centerStatus === "ACTIVE"
                  ? "accent"
                  : membership.centerStatus === "PENDING_APPROVAL"
                    ? "warning"
                    : "muted"
              }
            >
              {membership.centerStatus === "PENDING_APPROVAL"
                ? "Pending Review"
                : membership.centerStatus}
            </Badge>
          )}
        </div>
      </div>

      {isPending && (
        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => onAccept(membership.id)}
            className="gap-2 rounded-xl flex-1"
          >
            <CheckCircle size={16} /> Accept
          </Button>
          <Button
            variant="outline"
            onClick={() => onReject(membership.id)}
            className="gap-2 rounded-xl flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <XCircle size={16} /> Reject
          </Button>
        </div>
      )}

      {!isPending && membership.centerStatus === "ACTIVE" && (
        <div className="mt-6">
          <Link href={`/dashboard/centers/${membership.centerId}`}>
            <Button
              variant="outline"
              className="w-full rounded-xl bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 backdrop-blur-md transition-colors"
            >
              Manage Center
            </Button>
          </Link>
        </div>
      )}
    </GlassCard>
  );
}

export default function CentersPage() {
  const [memberships, setMemberships] = useState<MembershipResponse[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const result = await getMyCentersAction();
      if (result.data) setMemberships(result.data);
      else if (result.error) toast.error(result.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAccept(id: string) {
    const result = await acceptInvitationAction(id);
    if (result && "error" in result) toast.error(result.error);
    else {
      toast.success("Invitation accepted.");
      load();
    }
  }

  async function handleReject(id: string) {
    const result = await rejectInvitationAction(id);
    if (result && "error" in result) toast.error(result.error);
    else {
      toast.success("Invitation rejected.");
      load();
    }
  }

  const pending = memberships.filter((m) => m.status === "INVITED");
  const active = memberships.filter((m) => m.status === "ACTIVE");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="My Centers" />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="mx-auto max-w-4xl space-y-10">
          <CreateCenterFormWrapper onCreated={load} />

          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Pending Invitations
              </h2>
              {pending.map((m) => (
                <MembershipCard
                  key={m.id}
                  membership={m}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Active Centers
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2
                  size={24}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : active.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/20 dark:border-white/10 py-16 text-center bg-card/20 backdrop-blur-sm">
                <Building2 size={40} className="text-muted-foreground/50" />
                <div>
                  <p className="text-lg font-bold text-foreground">
                    No active centers yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Register a center or wait for an invitation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {active.map((m) => (
                  <MembershipCard
                    key={m.id}
                    membership={m}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
