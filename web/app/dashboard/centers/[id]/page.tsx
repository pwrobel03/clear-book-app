import { forbidden } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getMyMembershipInCenterAction,
  getCenterByIdAction,
  getCenterMembersAction,
} from "@/lib/actions/centers";

import { CenterSettingsClient } from "./settings-client";
import { InviteClient } from "./invite-client";
import { RemoveMemberButton } from "./remove-member-button";
import { GlassPanel } from "@/components/ui/glass";
import { PageHeader } from "@/components/dashboard/page-header";

// TODO: This page is currently very basic and only shows the staff list. We will add more features to it in the future (appointments management, center settings, etc.). For now, it's mostly a placeholder to build upon.
// TODO: We should let user to quit the center as well, but we need to implement that in the backend first (we need to add "quit" functionality to the membership management endpoints, currently we only have "remove" which is for admins to remove other members, but we also need "quit" for regular members to quit on their own).

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CenterDashboardPage({ params }: Props) {
  const { id } = await params;

  const [membershipResult, center, members] = await Promise.all([
    getMyMembershipInCenterAction(id),
    getCenterByIdAction(id),
    getCenterMembersAction(id),
  ]);

  if (membershipResult.error || !membershipResult.data || !center) {
    forbidden();
  }

  const membership = membershipResult.data;
  const isCenterAdmin = membership.role === "ADMIN";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="Center Management" />

      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <PageHeader
            title={membership.centerName}
            description={`${membership.centerCity} • Role: ${
              membership.role === "ADMIN" ? "Administrator" : "Staff"
            }`}
          />

          <Tabs defaultValue="staff" className="w-full">
            {/* Wystarczy zdefiniować siatkę (grid), resztę ogarnia nasz nowy globalny komponent! */}
            <TabsList className="mb-6 grid w-full grid-cols-2 lg:w-[600px] lg:grid-cols-4">
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              {isCenterAdmin && (
                <>
                  <TabsTrigger value="invites">Invite</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="staff" className="space-y-4 mt-0 outline-none">
              <GlassPanel className="p-8">
                <h3 className="mb-6 text-xl font-bold text-foreground">
                  Active Staff Members ({members.length})
                </h3>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No assigned staff members yet. Invite doctors to join this
                    center to see them here.
                  </p>
                ) : (
                  <div className="divide-y divide-black/5 dark:divide-white/10">
                    {members.map((member, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary shadow-inner">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              {member.firstName} {member.lastName}
                            </p>
                            {member.specializations &&
                              member.specializations.length > 0 && (
                                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                  {member.specializations.join(", ")}
                                </p>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              member.role === "ADMIN" ? "default" : "muted"
                            }
                            className="shadow-sm px-3 py-1 text-xs"
                          >
                            {member.role === "ADMIN" ? "Admin" : "Doctor"}
                          </Badge>
                          {isCenterAdmin && member.role !== "ADMIN" && (
                            <RemoveMemberButton
                              centerId={id}
                              membershipId={member.membershipId}
                              memberName={`Dr. ${member.lastName}`}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassPanel>
            </TabsContent>

            <TabsContent
              value="appointments"
              className="space-y-4 mt-0 outline-none"
            >
              <GlassPanel className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <p className="text-xl font-bold text-foreground">
                  Appointments Module
                </p>
                <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
                  Module for managing appointments will be available soon. In
                  the meantime, you can invite doctors to your center and manage
                  their roles in the "Staff" tab.
                </p>
              </GlassPanel>
            </TabsContent>

            {isCenterAdmin && (
              <>
                <TabsContent
                  value="invites"
                  className="space-y-4 mt-0 outline-none"
                >
                  <GlassPanel className="p-8">
                    <div className="mb-8 max-w-xl">
                      <h3 className="text-xl font-bold text-foreground">
                        Invite Doctors to Join
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Ask doctors to join your center by sending them an
                        invite code. You can also assign them a role (Doctor or
                        Admin) which determines their permissions within the
                        center.
                      </p>
                    </div>
                    <InviteClient centerId={id} />
                  </GlassPanel>
                </TabsContent>

                <TabsContent
                  value="settings"
                  className="space-y-4 mt-0 outline-none"
                >
                  <GlassPanel className="p-8">
                    <div className="mb-8 max-w-xl">
                      <h3 className="text-xl font-bold text-foreground">
                        Center Settings
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Edit your center's information, manage working hours,
                        and configure other settings related to how your center
                        operates within the ClearBook system.
                      </p>
                    </div>
                    <CenterSettingsClient center={center} />
                  </GlassPanel>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
