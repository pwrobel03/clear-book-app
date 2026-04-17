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

// ─── Create Center Form (Wrapper) ─────────────────────────────────────────────

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
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus size={16} />
        Register a Center
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-bold text-foreground">Register a Medical Center</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>

      <CenterForm onSubmit={handleCreate} onCancel={() => setOpen(false)} />
    </div>
  );
}

// ─── Membership Card ──────────────────────────────────────────────────────────

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
    <div
      className={cn(
        "rounded-xl border bg-card p-5 transition-all",
        isPending ? "border-warning/30 bg-warning/5" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              isPending ? "bg-warning/15" : "bg-primary/10",
            )}
          >
            <Building2
              size={18}
              className={isPending ? "text-warning" : "text-primary"}
            />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {membership.centerName}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              {membership.centerCity}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant={membership.role === "ADMIN" ? "default" : "muted"}>
            {membership.role === "ADMIN" && (
              <ShieldCheck size={10} className="mr-1" />
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
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            onClick={() => onAccept(membership.id)}
            className="gap-1.5"
          >
            <CheckCircle size={14} />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(membership.id)}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <XCircle size={14} />
            Reject
          </Button>
        </div>
      )}

      {/* Przycisk przejścia do panelu zarządzania placówką */}
      {!isPending && membership.centerStatus === "ACTIVE" && (
        <div className="mt-4">
          <Link href={`/dashboard/centers/${membership.centerId}`}>
            <Button variant="outline" size="sm" className="w-full">
              Manage Center
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CentersPage() {
  const [memberships, setMemberships] = useState<MembershipResponse[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const result = await getMyCentersAction();
      if (result.data) {
        setMemberships(result.data);
      } else if (result.error) {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAccept(id: string) {
    const result = await acceptInvitationAction(id);
    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Invitation accepted.");
      load();
    }
  }

  async function handleReject(id: string) {
    const result = await rejectInvitationAction(id);
    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Invitation rejected.");
      load();
    }
  }

  const pending = memberships.filter((m) => m.status === "INVITED");
  const active = memberships.filter((m) => m.status === "ACTIVE");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="My Centers" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <CreateCenterFormWrapper onCreated={load} />

          {/* Pending invitations */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Pending Invitations ({pending.length})
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

          {/* Active centers */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Active Centers ({active.length})
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2
                  size={22}
                  className="animate-spin text-muted-foreground"
                />
              </div>
            ) : active.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
                <Building2 size={32} className="text-muted-foreground/50" />
                <div>
                  <p className="font-medium text-foreground">
                    No active centers yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Register a center or wait for an invitation from an existing
                    center.
                  </p>
                </div>
              </div>
            ) : (
              active.map((m) => (
                <MembershipCard
                  key={m.id}
                  membership={m}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
