import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server/session";
import { AuthInitializer } from "@/components/dashboard/auth-initializer";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();

  // Extra safety outside the middleware
  if (!user) redirect("/auth");

  return (
    <>
      {/* Seeds the Zustand store with server-fetched user data */}
      <AuthInitializer user={user} />

      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar — hidden on mobile for now */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </>
  );
}
