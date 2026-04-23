"use server"

import { revalidatePath } from "next/cache"
import { springFetch } from "@/lib/server/spring"
import { callApi } from "@/lib/server/api-action"
import type { ActionResult } from "@/types/api"

export async function createWorkingBlockAction(data: {
  centerId: string
  startTime: string
  endTime: string
}): Promise<ActionResult<{ blockId: string; message: string }>> {
  
  const result = await callApi<{ blockId: string; message: string }>(
    () =>
      springFetch("/api/schedule/blocks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    "Failed to create working block."
  )

  if (!result.error) {
    revalidatePath("/dashboard/schedule")
  }

  return result
}

export type AvailabilityBlock = {
  id: string;
  centerId: string;
  centerName: string;
  startTime: string;
  endTime: string;
};

export async function getWorkingBlocksAction(
  startIso: string,
  endIso: string
): Promise<ActionResult<AvailabilityBlock[]>> {
  return callApi<AvailabilityBlock[]>(
    () =>
      springFetch(
        `/api/schedule/blocks?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`,
        {
          method: "GET",
        }
      ),
    "Failed to fetch working blocks."
  );
}