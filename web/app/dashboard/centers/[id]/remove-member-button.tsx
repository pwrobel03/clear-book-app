"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeCenterMemberAction } from "@/lib/actions/centers";

export function RemoveMemberButton({
  centerId,
  membershipId,
  memberName,
}: {
  centerId: string;
  membershipId: string;
  memberName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from this center?`,
      )
    )
      return;

    setLoading(true);
    const result = await removeCenterMemberAction(centerId, membershipId);

    if (result && "error" in result && result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${memberName} has been removed from the center.`);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2 ml-4"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
      <span className="hidden sm:inline">Remove</span>
    </Button>
  );
}
