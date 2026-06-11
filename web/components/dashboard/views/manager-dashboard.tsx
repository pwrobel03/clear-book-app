import Link from "next/link";
import { Building2, Plus, Users, ArrowRight } from "lucide-react";
import type { SessionUser } from "@/types/session";
import { PageHeader } from "../page-header";
import { GlassCard } from "@/components/ui/glass";
import { getMyCentersAction } from "@/lib/actions/centers";

export async function ManagerDashboard({ user }: { user: SessionUser }) {
  const membershipsResult = await getMyCentersAction();
  const memberships = membershipsResult.data ?? [];

  const activeCenters = memberships.filter((m) => m.status === "ACTIVE");
  const pendingInvitations = memberships.filter((m) => m.status === "INVITED");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manager Panel"
        description={`Hello, ${user.firstName}. Manage your medical centers and staff.`}
      />

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20">
              <Building2 size={22} className="text-primary dark:text-primary-light" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Active Centers</span>
          </div>
          <p className="mt-5 text-4xl font-black text-foreground">{activeCenters.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">Centers you manage</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20">
              <Users size={22} className="text-primary dark:text-primary-light" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Pending Invitations</span>
          </div>
          <p className="mt-5 text-4xl font-black text-foreground">{pendingInvitations.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">Invitations awaiting acceptance</p>
        </GlassCard>

        <Link href="/dashboard/centers/new">
          <GlassCard className="p-6 cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all h-full flex flex-col justify-center items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
              <Plus size={22} className="text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Register New Center</p>
              <p className="text-xs text-muted-foreground mt-1">Add a clinic or hospital to the platform</p>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Active centers list */}
      {activeCenters.length > 0 ? (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-lg font-bold text-foreground">Your Centers</p>
            <Link
              href="/dashboard/centers"
              className="flex items-center gap-1 text-sm text-accent hover:underline"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {activeCenters.slice(0, 5).map((m) => (
              <Link key={m.id} href={`/dashboard/centers/${m.centerId}`}>
                <div className="flex items-center justify-between py-3 hover:opacity-80 transition-opacity">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.centerName}</p>
                    <p className="text-xs text-muted-foreground">{m.centerCity}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                    {m.role}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 text-center">
          <Building2 size={40} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="font-semibold text-foreground">No centers yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Register your first medical center to get started.
          </p>
          <Link
            href="/dashboard/centers/new"
            className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-accent hover:underline"
          >
            Register a Center <ArrowRight size={14} />
          </Link>
        </GlassCard>
      )}

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <GlassCard className="p-6">
          <p className="text-lg font-bold text-foreground mb-4">Pending Invitations</p>
          <div className="divide-y divide-border">
            {pendingInvitations.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.centerName}</p>
                  <p className="text-xs text-muted-foreground">{m.centerCity} · {m.role}</p>
                </div>
                <Link
                  href="/dashboard/centers"
                  className="text-xs text-accent hover:underline"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
