import { Calendar, Stethoscope, Clock, ArrowRight } from "lucide-react";
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
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Good to see you, {user.firstName}
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          Manage your appointments and find the right doctor for you.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderCards.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className={glassCardClass}>
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
            <p className="mt-5 text-4xl font-black text-foreground">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* CTA - Glass Card */}
      <div
        className={`${glassCardClass} flex cursor-pointer items-center justify-between`}
      >
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner transition-transform group-hover:rotate-12">
            <Stethoscope
              size={26}
              className="text-accent dark:text-accent-light"
            />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Find a Doctor</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse verified doctors and book an appointment instantly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-accent dark:text-accent-light opacity-50 transition-opacity group-hover:opacity-100">
          Coming soon
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </div>
      </div>
    </div>
  );
}
