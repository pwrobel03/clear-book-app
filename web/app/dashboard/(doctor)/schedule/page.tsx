import { DashboardHeader } from "@/components/dashboard/header";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { Calendar as CalendarIcon, Clock, Building2 } from "lucide-react";
import { getMyCentersAction } from "@/lib/actions/centers";
import { ScheduleCalendarClient } from "./schedule-calendar-client";
import { ScheduleFormClient } from "./schedule-form-client";

export default async function SchedulePage() {
  const centersResult = await getMyCentersAction(); // Fetch centers where the doctor is a member
  const centers =
    centersResult.data?.filter((c) => c.status === "ACTIVE") || [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="My Schedule" />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <PageHeader
            title="Schedule Management"
            description="Define your working hours and availability blocks across different medical centers."
          />

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left column: Form for creating a new work block */}
            <div className="lg:col-span-1 space-y-6">
              <GlassPanel className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent shadow-inner">
                    <Clock size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Add Work Block
                  </h2>
                </div>

                {centers.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      You need to join a medical center first to set your
                      schedule.
                    </p>
                  </div>
                ) : (
                  <ScheduleFormClient centers={centers} />
                )}
              </GlassPanel>
            </div>

            {/* Right column: Calendar preview (placeholder for now) */}
            {/* <div className="lg:col-span-2 space-y-6">
              <GlassPanel className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5 border border-primary/10 shadow-inner mb-6">
                  <CalendarIcon size={32} className="text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Weekly Overview
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Your upcoming working blocks and appointments will appear
                  here. Currently, we are building the calendar visualization.
                </p>
              </GlassPanel>
            </div> */}
            {/* Prawa kolumna: Podgląd kalendarza */}
            <div className="lg:col-span-2 space-y-6">
              <GlassPanel className="p-6">
                <ScheduleCalendarClient />
              </GlassPanel>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
