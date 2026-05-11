import { getServerSession } from "@/lib/server/session";
import { forbidden } from "next/navigation";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();

  // Weryfikacja: Jeśli brak sesji lub rola to nie DOCTOR -> 403
  if (!user || user.role !== "DOCTOR") {
    forbidden();
  }

  return <>{children}</>;
}
