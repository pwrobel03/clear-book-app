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
import { GlassCard } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

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

function timeAgo(dateStr: string) {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86400000,
  );
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}

const centerTypeLabel: Record<string, string> = {
  CLINIC: "Clinic",
  HOSPITAL: "Hospital",
  PRIVATE_PRACTICE: "Private Practice",
  DIAGNOSTIC_CENTER: "Diagnostic Center",
  REHABILITATION_CENTER: "Rehabilitation Center",
};

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
    <GlassCard
      className={cn(
        "p-6",
        "border-warning/50 dark:border-warning/30 bg-warning/5 dark:bg-warning/5",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 shadow-inner text-lg font-bold text-primary dark:text-primary-light transition-transform group-hover:scale-110">
            {doctor.firstName[0]}
            {doctor.lastName[0]}
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              Dr. {doctor.firstName} {doctor.lastName}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <Mail size={14} /> {doctor.email}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Clock size={12} /> Applied {timeAgo(doctor.createdAt)}
            </p>
          </div>
        </div>
        <Badge variant="warning">Pending</Badge>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          onClick={() => onApprove(doctor.id)}
          disabled={loading}
          className="gap-2 rounded-xl flex-1"
        >
          <CheckCircle size={16} /> Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => onReject(doctor.id)}
          disabled={loading}
          className="gap-2 rounded-xl flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <XCircle size={16} /> Reject
        </Button>
      </div>
    </GlassCard>
  );
}

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
    <GlassCard className="px-8 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 shadow-inner transition-transform group-hover:scale-110">
            <Building2
              size={22}
              className="text-primary dark:text-primary-light"
            />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{center.name}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <MapPin size={14} /> {center.address}, {center.city}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Clock size={12} /> Submitted {timeAgo(center.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="muted">
            {centerTypeLabel[center.type] ?? center.type}
          </Badge>
          <Badge variant="warning">Pending Review</Badge>
        </div>
      </div>
      {center.description && (
        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {center.description}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button
          onClick={() => onApprove(center.id)}
          disabled={loading}
          className="gap-2 rounded-xl flex-1"
        >
          <CheckCircle size={16} /> Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => onReject(center.id)}
          disabled={loading}
          className="gap-2 rounded-xl flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <XCircle size={16} /> Reject
        </Button>
      </div>
    </GlassCard>
  );
}

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/20 dark:border-white/10 py-16 text-center bg-card/20 backdrop-blur-sm">
      <Icon size={32} className="text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">{label}</p>
    </div>
  );
}

export default function VerificationsPage() {
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [centers, setCenters] = useState<PendingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [doctorsResult, centersResult] = await Promise.all([
      getPendingDoctorsAction(),
      getPendingCentersAction(),
    ]);
    if (doctorsResult.data) setDoctors(doctorsResult.data);
    else if (doctorsResult.error) toast.error(doctorsResult.error);
    if (centersResult.data) setCenters(centersResult.data);
    else if (centersResult.error) toast.error(centersResult.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDoctor(id: string, action: "APPROVE" | "REJECT") {
    setActionLoading(true);
    const result = await verifyDoctorAction(id, action);
    if (result && "error" in result) toast.error(result.error);
    else
      toast.success(
        `Doctor account has been ${action === "APPROVE" ? "approved" : "rejected"}.`,
      );
    await load();
    setActionLoading(false);
  }

  async function handleCenter(id: string, action: "APPROVE" | "REJECT") {
    setActionLoading(true);
    const result =
      action === "APPROVE"
        ? await approveCenterAction(id)
        : await rejectCenterAction(id);
    if (result && "error" in result) toast.error(result.error);
    else
      toast.success(
        `Medical center has been ${action === "APPROVE" ? "approved" : "rejected"}.`,
      );
    await load();
    setActionLoading(false);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Verifications" />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="mx-auto max-w-4xl space-y-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={32}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : (
            <>
              {doctors.length + centers.length === 0 && (
                <GlassCard className={" text-center py-12"}>
                  <p className="text-xl font-bold text-foreground">
                    All clear!
                  </p>
                  <p className="mt-2 text-base text-muted-foreground">
                    No pending verifications at this time.
                  </p>
                </GlassCard>
              )}

              {doctors.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      Pending Doctors
                    </h2>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning text-xs font-bold text-warning-foreground shadow-sm">
                      {doctors.length}
                    </span>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {doctors.map((d) => (
                      <DoctorCard
                        key={d.id}
                        doctor={d}
                        onApprove={(id) => handleDoctor(id, "APPROVE")}
                        onReject={(id) => handleDoctor(id, "REJECT")}
                        loading={actionLoading}
                      />
                    ))}
                  </div>
                </div>
              )}

              {centers.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      Pending Medical Centers
                    </h2>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning text-xs font-bold text-warning-foreground shadow-sm">
                      {centers.length}
                    </span>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {centers.map((c) => (
                      <CenterCard
                        key={c.id}
                        center={c}
                        onApprove={(id) => handleCenter(id, "APPROVE")}
                        onReject={(id) => handleCenter(id, "REJECT")}
                        loading={actionLoading}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
