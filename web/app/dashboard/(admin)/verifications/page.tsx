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
import { toast } from "sonner";

// TODO: We should split this page into multiple subpages (doctors verification, centers verification, etc.) but for now we will keep everything in one place to speed up development.

// TODO: We should also add some kind of notification system to notify admin when they receive new verification requests, but for now they will have to check this page manually to see if they received any new requests.

// TODO: We should add pagination to this page as well, but for now we will just load all pending verifications at once since we don't expect to have a lot of them.

// TODO: We should also add some filters and search functionality to this page, but for now we will just show all pending verifications in a simple list.

// TODO: We should also add a way to see more details about each doctor/center (like their profile, submitted documents, etc.) but for now we will just show basic information in the list and have approve/reject buttons.

// TODOL We should also add some kind of confirmation dialog before approving/rejecting a doctor/center, to prevent accidental clicks, but for now we will just have the buttons without confirmation to speed up development.

// TODO: We should also add some kind of "reason for rejection" input when rejecting a doctor/center, to provide feedback to the applicants, but for now we will just have a simple reject button without reason input to speed up development.

// TODO: We should also add some kind of "notes" functionality for admin to add internal notes about each doctor/center (like why they were rejected, what issues they had with their application, etc.) but for now we will not have notes functionality to speed up development.


// TODO: We should also add some kind of "analytics" functionality to show some statistics about the pending verifications (like how many doctors/centers are pending, how long they have been pending, etc.) but for now we will not have analytics functionality to speed up development.

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

    // Pobieramy dane równolegle używając naszych nowych Server Actions
    const [doctorsResult, centersResult] = await Promise.all([
      getPendingDoctorsAction(),
      getPendingCentersAction(),
    ]);

    if (doctorsResult.data) {
      setDoctors(doctorsResult.data);
    } else if (doctorsResult.error) {
      toast.error(doctorsResult.error);
    }

    if (centersResult.data) {
      setCenters(centersResult.data);
    } else if (centersResult.error) {
      toast.error(centersResult.error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDoctor(id: string, action: "APPROVE" | "REJECT") {
    setActionLoading(true);
    const result = await verifyDoctorAction(id, action);

    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success(
        `Doctor account has been ${
          action === "APPROVE" ? "approved" : "rejected"
        }.`,
      );
    }

    await load();
    setActionLoading(false);
  }

  async function handleCenter(id: string, action: "APPROVE" | "REJECT") {
    setActionLoading(true);
    let result;

    if (action === "APPROVE") {
      result = await approveCenterAction(id);
    } else {
      result = await rejectCenterAction(id);
    }

    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success(
        `Medical center has been ${
          action === "APPROVE" ? "approved" : "rejected"
        }.`,
      );
    }

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
                      onApprove={(id) => handleDoctor(id, "APPROVE")}
                      onReject={(id) => handleDoctor(id, "REJECT")}
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
                      onApprove={(id) => handleCenter(id, "APPROVE")}
                      onReject={(id) => handleCenter(id, "REJECT")}
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
