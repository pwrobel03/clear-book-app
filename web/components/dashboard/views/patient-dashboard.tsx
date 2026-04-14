import { Calendar, Stethoscope, Clock, ArrowRight } from "lucide-react";
import type { SessionUser } from "@/types/session";

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
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Good to see you, {user.firstName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your appointments and find the right doctor for you.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderCards.map(({ icon: Icon, label, value, sub }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <Icon size={18} className="text-accent" />
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

      {/* CTA */}
      <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
            <Stethoscope size={20} className="text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Find a Doctor</p>
            <p className="text-sm text-muted-foreground">
              Browse verified doctors and book an appointment instantly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-accent opacity-50">
          Coming soon
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}
