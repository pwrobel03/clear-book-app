"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteByCodeAction } from "@/lib/actions/centers";
import type { MembershipRole } from "@/types/api";

// TODO: This component is currently very basic and only allows to invite a doctor by code. In the future, we might want to add more features to it (like inviting by email, managing pending invitations, etc.) but for now it's just a simple form to send an invitation by code.

export function InviteClient({ centerId }: { centerId: string }) {
  const [code, setCode] = useState("");
  const [role, setRole] = useState<MembershipRole>("MEMBER");
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    const result = await inviteByCodeAction(centerId, code.trim(), role);

    if (result && "error" in result && result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        "Invitation sent successfully! The doctor must now accept it.",
      );
      setCode(""); // clean the input after successful invite
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleInvite}
      className="flex flex-col gap-5 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-2">
        <label className="text-sm font-semibold text-foreground ml-1">
          Invite Code
        </label>
        <Input
          placeholder="e.g. CB-A1B2-C3D4"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={14}
          required
        />
      </div>

      <div className="w-full sm:w-48 space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Assign Role
        </label>
        <Select
          value={role}
          onValueChange={(v) => setRole(v as MembershipRole)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Doctor (Staff)</SelectItem>
            <SelectItem value="ADMIN">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={loading || !code.trim()}
        className="gap-2"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <UserPlus size={16} />
        )}
        Send Invite
      </Button>
    </form>
  );
}
