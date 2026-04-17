import { getServerSession } from "@/lib/server/session";
import { forbidden } from "next/navigation";

// TODO: This layout is currently just a simple wrapper that checks if the user is an admin. In the future, we might want to add some common admin dashboard features here (like a sidebar with admin navigation links, etc.) but for now it's just a simple wrapper to protect the admin routes.

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
