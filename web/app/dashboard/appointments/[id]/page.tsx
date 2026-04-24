import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { getAppointmentAction } from "@/lib/actions/booking";
import { AppointmentDetailClient } from "./appointment-detail-client";

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAppointmentAction(id);

  if (result.error || !result.data) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Szczegóły wizyty" />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <AppointmentDetailClient appointment={result.data} />
        </div>
      </main>
    </div>
  );
}
