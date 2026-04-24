"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Stethoscope,
  Clock,
  ArrowRight,
  Loader2,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import type { SessionUser } from "@/types/session";
import { GlassCard } from "@/components/ui/glass";
import { PageHeader } from "../page-header";
import { getMyAppointmentsAction, type AppointmentResponse } from "@/lib/actions/booking";

export function PatientDashboard({ user }: { user: SessionUser }) {
  const [upcomingAppts, setUpcomingAppts] = useState<AppointmentResponse[]>([]);
  const [pastCount, setPastCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [scheduled, reserved, completed] = await Promise.all([
        getMyAppointmentsAction({ status: "SCHEDULED", page: 0, size: 5 }),
        getMyAppointmentsAction({ status: "RESERVED", page: 0, size: 5 }),
        getMyAppointmentsAction({ status: "COMPLETED", page: 0, size: 1 }),
      ]);

      const upcoming = [
        ...(scheduled.data?.content ?? []),
        ...(reserved.data?.content ?? []),
      ].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

      setUpcomingAppts(upcoming);
      setPastCount(completed.data?.totalElements ?? 0);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const nextAppointment = upcomingAppts[0] ?? null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <PageHeader
          title={`Good to see you, ${user.firstName}`}
          description="Manage your appointments and find the right doctor for you."
        />
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Stats row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Upcoming count */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner">
                  <Calendar size={22} className="text-accent dark:text-accent-light" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  Upcoming Appointments
                </span>
              </div>
              {isLoading ? (
                <div className="mt-5 h-10 w-12 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
              ) : (
                <>
                  <p className="mt-5 text-4xl font-black text-foreground">
                    {upcomingAppts.length}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {upcomingAppts.length === 0
                      ? "No upcoming appointments"
                      : upcomingAppts.length === 1
                      ? "1 appointment scheduled"
                      : `${upcomingAppts.length} appointments scheduled`}
                  </p>
                </>
              )}
            </GlassCard>

            {/* Past visits */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner">
                  <Clock size={22} className="text-accent dark:text-accent-light" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  Past Visits
                </span>
              </div>
              {isLoading ? (
                <div className="mt-5 h-10 w-12 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
              ) : (
                <>
                  <p className="mt-5 text-4xl font-black text-foreground">
                    {pastCount ?? "—"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {pastCount === 0
                      ? "No visit history yet"
                      : `${pastCount} completed visit${pastCount !== 1 ? "s" : ""}`}
                  </p>
                </>
              )}
            </GlassCard>

            {/* Find a doctor CTA */}
            <Link href="/doctors" className="sm:col-span-2 lg:col-span-1">
              <GlassCard className="group flex h-full cursor-pointer items-center justify-between p-6 hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 dark:bg-accent/20 shadow-inner transition-transform group-hover:rotate-6">
                    <Stethoscope size={26} className="text-accent dark:text-accent-light" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">Find a Doctor</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Browse doctors and book instantly.
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-accent dark:text-accent-light opacity-50 transition-all group-hover:opacity-100 group-hover:translate-x-1"
                />
              </GlassCard>
            </Link>
          </div>

          {/* Next appointment highlight */}
          {!isLoading && nextAppointment && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">
                Next Appointment
              </h2>
              <GlassCard className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <Stethoscope size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {nextAppointment.serviceName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Dr. {nextAppointment.doctorFirstName}{" "}
                        {nextAppointment.doctorLastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:text-right">
                    <span className="font-semibold text-foreground">
                      {format(
                        new Date(nextAppointment.startTime),
                        "EEE, MMM d • HH:mm",
                      )}
                    </span>
                    <span className="flex items-center gap-1 sm:justify-end">
                      <MapPin size={12} />
                      {nextAppointment.centerName}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Quick link to all appointments */}
          {!isLoading && upcomingAppts.length > 1 && (
            <Link href="/dashboard/appointments">
              <GlassCard className="group flex cursor-pointer items-center justify-between p-5 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    View all {upcomingAppts.length} upcoming appointments
                  </span>
                </div>
                <ArrowRight
                  size={16}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </GlassCard>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
