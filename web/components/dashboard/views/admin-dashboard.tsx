import { Users, ShieldCheck, Building2 } from "lucide-react";
import type { SessionUser } from "@/types/session";

// ─── Glass Card Class ───
const glassCardClass = `
  group relative overflow-hidden rounded-3xl p-6 transition-all duration-300
  border border-white/20 border-t-white/40 dark:border-white/5 dark:border-t-white/10 
  bg-gradient-to-br from-white/10 to-white/5 dark:from-white/[0.04] dark:to-transparent 
  backdrop-blur-xl 
  shadow-lg shadow-black/5 dark:shadow-black/20 
  hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 
  hover:from-white/20 hover:to-white/10 dark:hover:from-white/[0.06] dark:hover:to-white/[0.01]
`;

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
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Admin Panel
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          Hello, {user.firstName}. Manage platform users, doctors, and medical
          centers.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderStats.map(({ icon: Icon, label, value, sub, urgent }) => (
          <div key={label} className={glassCardClass}>
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
          </div>
        ))}
      </div>

      <div className={glassCardClass}>
        <p className="text-lg font-bold text-foreground">Recent Activity</p>
        <p className="mt-3 text-base text-muted-foreground">
          Activity feed will appear here once data is available.
        </p>
      </div>
    </div>
  );
}
