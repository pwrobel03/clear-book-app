import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { getAppointmentAction } from "@/lib/actions/booking";
import { AppointmentDetailClient } from "./appointment-detail-client";
import { getServerSession } from "@/lib/server/session";
import { AppointmentReviewSection } from "./appointment-review-section";
import { getReviewAction } from "@/lib/actions/review";

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get user session to determine role and pass it to the action for correct endpoint fetching
  const user = await getServerSession();
  const role = user?.role || "USER";

  // Delegate fetching appointment details to the action, passing the user role so it can hit the correct endpoint
  const result = await getAppointmentAction(id, role);

  if (result.error || !result.data) {
    notFound();
  }

  const reviewResult = await getReviewAction(id);
  const initialReview = reviewResult.data || null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Appointment Details" />
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <AppointmentDetailClient appointment={result.data} userRole={role} />
          <AppointmentReviewSection
            appointmentId={id}
            status={result.data.status}
            isDoctor={role === "DOCTOR"}
            initialReview={initialReview}
          />
        </div>
      </main>
    </div>
  );
}
