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

// TODO: This page is currently very basic and only shows the staff list. We will add more features to it in the future (appointments management, center settings, etc.). For now, it's mostly a placeholder to build upon.
// TODO: We should let user to quit the center as well, but we need to implement that in the backend first (we need to add "quit" functionality to the membership management endpoints, currently we only have "remove" which is for admins to remove other members, but we also need "quit" for regular members to quit on their own).

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CenterDashboardPage({ params }: Props) {
  const { id } = await params;

  // Pobieramy równolegle dane o członkostwie użytkownika oraz dane samej placówki
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
      <DashboardHeader
        title={membership.centerName}
        description={`${membership.centerCity} • Role: ${membership.role === "ADMIN" ? "Admin" : "Staff"}`}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 lg:w-[600px] lg:grid-cols-4">
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>

              {isCenterAdmin && (
                <>
                  <TabsTrigger value="invites">Invite</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="appointments" className="space-y-4">
              <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">
                  Module for managing appointments will be available soon. In
                  the meantime, you can invite doctors to your center and manage
                  their roles in the "Staff" tab.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-bold text-foreground">
                  Active Staff Members ({members.length})
                </h3>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No, assigned staff members yet. Invite doctors to join this
                    center to see them here.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {members.map((member, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {member.firstName} {member.lastName}
                            </p>
                            {member.specializations &&
                              member.specializations.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {member.specializations.join(", ")}
                                </p>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              member.role === "ADMIN" ? "default" : "muted"
                            }
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
              </div>
            </TabsContent>

            {isCenterAdmin && (
              <>
                <TabsContent value="invites">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-foreground">
                        Invite Doctors to Join Your Center
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Ask doctors to join your center by sending them an
                        invite code. You can also assign them a role (Doctor or
                        Admin) which determines their permissions within the
                        center.
                      </p>
                    </div>
                    <InviteClient centerId={id} />
                  </div>
                </TabsContent>

                <TabsContent value="settings">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-foreground">
                        Center Settings
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Edit your center's information, manage working hours,
                        and configure other settings related to how your center
                        operates within the ClearBook system.
                      </p>
                    </div>
                    <CenterSettingsClient center={center} />
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
