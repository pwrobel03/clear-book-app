import { DashboardHeader } from "@/components/dashboard/header";
import { ServiceManagerClient } from "./service-manager-client";

export const metadata = {
  title: "My Services | Clearbook",
  description: "Manage your medical services, durations, and pricing.",
};

export default function ServicesPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Services" />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <ServiceManagerClient />
        </div>
      </main>
    </div>
  );
}
