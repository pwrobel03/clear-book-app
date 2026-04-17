import { getServerSession } from "@/lib/server/session";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { PatientDashboard } from "@/components/dashboard/views/patient-dashboard";
import { DoctorDashboard } from "@/components/dashboard/views/doctor-dashboard";
import { AdminDashboard } from "@/components/dashboard/views/admin-dashboard";

export default async function DashboardPage() {
  const user = await getServerSession();
  if (!user) redirect("/auth");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        {user.role === "USER" && <PatientDashboard user={user} />}
        {user.role === "DOCTOR" && <DoctorDashboard user={user} />}
        {user.role === "ADMIN" && <AdminDashboard user={user} />}
      </main>
    </div>
  );
}
