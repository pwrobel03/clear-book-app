"use client";

import { useEffect, useState, useCallback } from "react";
import {
  verifyDoctorAction,
  approveCenterAction,
  rejectCenterAction,
  getPendingDoctorsAction,
  getPendingCentersAction,
} from "@/lib/actions/admin";
import {
  Stethoscope,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  Mail,
  Clock,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type PendingDoctor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

type PendingCenter = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  type: string;
  createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const centerTypeLabel: Record<string, string> = {
  CLINIC: "Clinic",
  HOSPITAL: "Hospital",
  PRIVATE_PRACTICE: "Private Practice",
  DIAGNOSTIC_CENTER: "Diagnostic Center",
  REHABILITATION_CENTER: "Rehabilitation Center",
};

// ─── Doctor Card ──────────────────────────────────────────────────────────────

function DoctorCard({
  doctor,
  onApprove,
  onReject,
  loading,
}: {
  doctor: PendingDoctor;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {doctor.firstName[0]}
            {doctor.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Dr. {doctor.firstName} {doctor.lastName}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail size={11} />
              {doctor.email}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock size={11} />
              Applied {timeAgo(doctor.createdAt)}
            </p>
          </div>
        </div>
        <Badge variant="warning">Pending</Badge>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          onClick={() => onApprove(doctor.id)}
          disabled={loading}
          className="gap-1.5"
        >
          <CheckCircle size={14} />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReject(doctor.id)}
          disabled={loading}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <XCircle size={14} />
          Reject
        </Button>
      </div>
    </div>
  );
}

// ─── Center Card ──────────────────────────────────────────────────────────────

function CenterCard({
  center,
  onApprove,
  onReject,
  loading,
}: {
  center: PendingCenter;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{center.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              {center.address}, {center.city}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock size={11} />
              Submitted {timeAgo(center.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="muted">
            {centerTypeLabel[center.type] ?? center.type}
          </Badge>
          <Badge variant="warning">Pending Review</Badge>
        </div>
      </div>

      {center.description && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {center.description}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          onClick={() => onApprove(center.id)}
          disabled={loading}
          className="gap-1.5"
        >
          <CheckCircle size={14} />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReject(center.id)}
          disabled={loading}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <XCircle size={14} />
          Reject
        </Button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
      <Icon size={24} className="text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VerificationsPage() {
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [centers, setCenters] = useState<PendingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [dRes, cRes] = await Promise.all([
      getPendingDoctorsAction(),
      getPendingCentersAction(),
    ]);

    if (dRes.data) setDoctors(dRes.data);
    if (cRes.data) setCenters(cRes.data);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDoctor(id: string, action: "approve" | "reject") {
    setActionLoading(true);
    await verifyDoctorAction(id, action);
    await load();
    setActionLoading(false);
  }

  async function handleCenter(id: string, action: "approve" | "reject") {
    setActionLoading(true);
    if (action === "approve") await approveCenterAction(id);
    else await rejectCenterAction(id);
    await load();
    setActionLoading(false);
  }

  const total = doctors.length + centers.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Verifications" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={24}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : (
            <>
              {total === 0 && (
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-6 text-center">
                  <p className="font-semibold text-foreground">All clear!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No pending verifications at this time.
                  </p>
                </div>
              )}

              {/* Pending Doctors */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Pending Doctors
                  </h2>
                  {doctors.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white">
                      {doctors.length}
                    </span>
                  )}
                </div>

                {doctors.length === 0 ? (
                  <EmptyState
                    icon={Stethoscope}
                    label="No doctors awaiting verification"
                  />
                ) : (
                  doctors.map((d) => (
                    <DoctorCard
                      key={d.id}
                      doctor={d}
                      onApprove={(id) => handleDoctor(id, "approve")}
                      onReject={(id) => handleDoctor(id, "reject")}
                      loading={actionLoading}
                    />
                  ))
                )}
              </div>

              {/* Pending Centers */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Pending Medical Centers
                  </h2>
                  {centers.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white">
                      {centers.length}
                    </span>
                  )}
                </div>

                {centers.length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    label="No centers awaiting approval"
                  />
                ) : (
                  centers.map((c) => (
                    <CenterCard
                      key={c.id}
                      center={c}
                      onApprove={(id) => handleCenter(id, "approve")}
                      onReject={(id) => handleCenter(id, "reject")}
                      loading={actionLoading}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
