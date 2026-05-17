import { getServerSession } from "@/lib/server/session";
import { AppointmentsClient } from "./appointments-client";

export default async function AppointmentsPage() {
  const user = await getServerSession();
  const role = user?.role || "USER";

  // Renderujemy Twój ładny interfejs, przekazując mu informację, czy to lekarz
  return <AppointmentsClient userRole={role} />;
}
