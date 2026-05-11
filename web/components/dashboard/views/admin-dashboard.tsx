import { Users, ShieldCheck, Building2 } from "lucide-react";
import type { SessionUser } from "@/types/session";
import { PageHeader } from "../page-header";
import { GlassCard } from "@/components/ui/glass";

const placeholderStats = [
  {
    icon: ShieldCheck,
    label: "Pending Verifications",
    value: "—",
    sub: "Doctors awaiting approval",
    urgent: true,
  },
  { icon: Users, label: "Total Users", value: "—", sub: "Registered accounts" },
  {
    icon: Building2,
    label: "Medical Centers",
    value: "—",
    sub: "Active centers on platform",
  },
];

export function AdminDashboard({ user }: { user: SessionUser }) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Panel"
        description={`Hello, ${user.firstName}. Manage platform users, doctors, and medical centers.`}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderStats.map(({ icon: Icon, label, value, sub, urgent }) => (
          <GlassCard key={label} className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110 ${
                  urgent
                    ? "bg-warning/15 dark:bg-warning/20"
                    : "bg-primary/10 dark:bg-primary/20"
                }`}
              >
                <Icon
                  size={22}
                  className={
                    urgent
                      ? "text-warning"
                      : "text-primary dark:text-primary-light"
                  }
                />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {label}
              </span>
            </div>
            <p className="mt-5 text-4xl font-black text-foreground">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <p className="text-lg font-bold text-foreground">Recent Activity</p>
        <p className="mt-3 text-base text-muted-foreground">
          Activity feed will appear here once data is available.
        </p>
      </GlassCard>
    </div>
  );
}
