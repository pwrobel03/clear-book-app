import { Calendar, Stethoscope, Clock, ArrowRight } from "lucide-react";
import type { SessionUser } from "@/types/session";
import { GlassCard } from "@/components/ui/glass";
import { DashboardHeader } from "@/components/dashboard/header";
import { PageHeader } from "../page-header";

const placeholderCards = [
  {
    icon: Calendar,
    label: "Upcoming Appointments",
    value: "—",
    sub: "No upcoming appointments",
  },
  {
    icon: Clock,
    label: "Past Visits",
    value: "—",
    sub: "No visit history yet",
  },
];

export function PatientDashboard({ user }: { user: SessionUser }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader
        title={`Good to see you, ${user.firstName}`}
        description="Manage your appointments and find the right doctor for you."
      />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <PageHeader
          title={`Good to see you, ${user.firstName}`}
          description="Manage your appointments and find the right doctor for you."
        />
        <div className="space-y-8 max-w-5xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {placeholderCards.map(({ icon: Icon, label, value, sub }) => (
              <GlassCard key={label} className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner transition-transform group-hover:scale-110">
                    <Icon
                      size={22}
                      className="text-accent dark:text-accent-light"
                    />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {label}
                  </span>
                </div>
                <p className="mt-5 text-4xl font-black text-foreground">
                  {value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="flex cursor-pointer items-center justify-between p-6">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner transition-transform group-hover:rotate-12">
                <Stethoscope
                  size={26}
                  className="text-accent dark:text-accent-light"
                />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  Find a Doctor
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Browse verified doctors and book an appointment instantly.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-accent dark:text-accent-light opacity-50 transition-opacity group-hover:opacity-100">
              Coming soon{" "}
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
