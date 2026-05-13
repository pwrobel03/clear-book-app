import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server/session";
import { AuthInitializer } from "@/components/dashboard/auth-initializer";
import { Sidebar } from "@/components/dashboard/sidebar";
import { GlobalNotificationListener } from "./notification-listener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();
  if (!user) redirect("/auth");

  return (
    <>
      {/* Seeds the Zustand store with server-fetched user data */}
      <AuthInitializer user={user} />
      <GlobalNotificationListener />

      <div className="relative flex h-screen overflow-hidden bg-background">
        {/* ── Glassy, Central Light Blobs ── */}
        <div className="pointer-events-none absolute top-[20%] left-[30%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-[140px] dark:bg-[#357d60]/20" />
        <div className="pointer-events-none absolute bottom-[20%] right-[20%] h-[500px] w-[500px] translate-x-1/4 translate-y-1/4 rounded-full bg-accent/20 blur-[140px] dark:bg-[#4a9b7a]/15" />

        <div className="relative z-10 flex h-full w-full p-0 md:p-4 gap-4">
          <div className="hidden md:flex flex-col">
            <Sidebar />
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-none md:rounded-3xl bg-transparent">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
