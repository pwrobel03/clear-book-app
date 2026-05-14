import { DashboardHeader } from "@/components/dashboard/header";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Reports" />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <PageHeader
            title="Monthly Reports"
            description="Track your appointment statistics and earnings month by month."
          />
          <ReportsClient />
        </div>
      </main>
    </div>
  );
}
