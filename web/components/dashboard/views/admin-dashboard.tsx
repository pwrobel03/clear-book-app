import Link from "next/link";
import { Users, ShieldCheck, Building2, ArrowRight } from "lucide-react";
import type { SessionUser } from "@/types/session";
import { PageHeader } from "../page-header";
import { GlassCard } from "@/components/ui/glass";
import { getPendingDoctorsAction, getPendingCentersAction } from "@/lib/actions/admin";

export async function AdminDashboard({ user }: { user: SessionUser }) {
  // Fetch real data in parallel — errors are non-fatal, fall back to "—"
  const [doctorsResult, centersResult] = await Promise.all([
    getPendingDoctorsAction(),
    getPendingCentersAction(),
  ]);

  const pendingDoctors = doctorsResult.data?.length ?? "—";
  const pendingCenters = centersResult.data?.length ?? "—";

  const stats = [
    {
      icon: ShieldCheck,
      label: "Pending Doctor Verifications",
      value: pendingDoctors,
      sub: "Awaiting approval",
      urgent: typeof pendingDoctors === "number" && pendingDoctors > 0,
      href: "/dashboard/verifications",
    },
    {
      icon: Building2,
      label: "Pending Centers",
      value: pendingCenters,
      sub: "Centers awaiting activation",
      urgent: typeof pendingCenters === "number" && pendingCenters > 0,
      href: "/dashboard/verifications",
    },
    {
      icon: Users,
      label: "Total Pending",
      value:
        typeof pendingDoctors === "number" && typeof pendingCenters === "number"
          ? pendingDoctors + pendingCenters
          : "—",
      sub: "Items requiring attention",
      urgent: false,
      href: "/dashboard/verifications",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Panel"
        description={`Hello, ${user.firstName}. Manage platform users, doctors, and medical centers.`}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, sub, urgent, href }) => (
          <Link key={label} href={href}>
            <GlassCard className="p-6 cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${
                    urgent
                      ? "bg-warning/15 dark:bg-warning/20"
                      : "bg-primary/10 dark:bg-primary/20"
                  }`}
                >
                  <Icon
                    size={22}
                    className={urgent ? "text-warning" : "text-primary dark:text-primary-light"}
                  />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              </div>
              <p className={`mt-5 text-4xl font-black ${urgent ? "text-warning" : "text-foreground"}`}>
                {value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Pending doctors list */}
      {doctorsResult.data && doctorsResult.data.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-bold text-foreground">Doctors Awaiting Verification</p>
            <Link
              href="/dashboard/verifications"
              className="flex items-center gap-1 text-sm text-accent hover:underline"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {doctorsResult.data.slice(0, 5).map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {doctor.firstName} {doctor.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{doctor.email}</p>
                </div>
                <span className="text-xs text-warning font-medium px-2 py-0.5 rounded-full bg-warning/10">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {pendingDoctors === 0 && pendingCenters === 0 && (
        <GlassCard className="p-6">
          <p className="text-lg font-bold text-foreground">All Clear</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No pending verifications or center approvals at this time.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
