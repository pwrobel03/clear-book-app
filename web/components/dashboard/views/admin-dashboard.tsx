import { Users, ShieldCheck, Building2 } from "lucide-react";
import type { SessionUser } from "@/types/session";

const placeholderStats = [
  { icon: ShieldCheck, label: "Pending Verifications", value: "—", sub: "Doctors awaiting approval", urgent: true },
  { icon: Users, label: "Total Users", value: "—", sub: "Registered accounts" },
  { icon: Building2, label: "Medical Centers", value: "—", sub: "Active centers on platform" },
];

export function AdminDashboard({ user }: { user: SessionUser }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Admin Panel
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hello, {user.firstName}. Manage platform users, doctors, and medical centers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderStats.map(({ icon: Icon, label, value, sub, urgent }) => (
          <div
            key={label}
            className={`rounded-xl border bg-card p-5 ${
              urgent ? "border-warning/30 bg-warning/5" : "border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  urgent ? "bg-warning/15" : "bg-primary/10"
                }`}
              >
                <Icon
                  size={18}
                  className={urgent ? "text-warning" : "text-primary"}
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {label}
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Recent Activity</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Activity feed will appear here once data is available.
        </p>
      </div>
    </div>
  );
}
