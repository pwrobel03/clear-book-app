import { getServerSession } from "@/lib/server/session";
import { forbidden } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();

  // Weryfikacja: Jeśli brak sesji lub rola to nie ADMIN -> 403
  if (!user || user.role !== "ADMIN") {
    forbidden();
  }

  return <>{children}</>;
}
