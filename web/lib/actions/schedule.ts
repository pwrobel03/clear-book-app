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

/* TYPES */

export type AvailabilityBlock = {
  id: string;
  centerId: string;
  centerName: string;
  startTime: string;
  endTime: string;
};

export type DoctorServiceResponse = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
};

/* Fetch all working blocks within a date range to populate the schedule view */
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

/* Duplicate Week to fill the schedule */
export async function copyWeekAction(data: {
  sourceWeekStart: string;
  weeksToCopy: number;
}): Promise<ActionResult<{ message: string }>> {
  const result = await callApi<{ message: string }>(
    () =>
      springFetch("/api/schedule/blocks/copy", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    "Failed to copy schedule."
  );

  return result;
}

/* Delete a working block to handle deletion, updates, free slots */
export async function deleteWorkingBlockAction(
  blockId: string
): Promise<ActionResult<{ message: string }>> {
  const result = await callApi<{ message: string }>(
    () =>
      springFetch(`/api/schedule/blocks/${blockId}`, {
        method: "DELETE",
      }),
    "Failed to delete working block."
  );

  return result;
}

/* Update a working block to handle updates, free slots */
export async function updateWorkingBlockAction(
  blockId: string,
  data: { newStartTime: string; newEndTime: string }
): Promise<ActionResult<{ message: string }>> {
  return callApi<{ message: string }>(
    () =>
      springFetch(`/api/schedule/blocks/${blockId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    "Failed to update working block."
  );
}

export async function getMyServicesAction(): Promise<ActionResult<DoctorServiceResponse[]>> {
  return callApi(
    () => springFetch(`/api/schedule/services`, { 
      method: "GET",
      cache: "no-store" // Always fetch fresh data for services in case of recent changes
    }),
    "Failed to fetch your services."
  );
}

export async function createDoctorServiceAction(data: {
  name: string;
  durationMinutes: number;
  price: number;
}): Promise<ActionResult<DoctorServiceResponse>> {
  return callApi(
    () => springFetch(`/api/schedule/services`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    "Failed to create service."
  );
}

export async function updateDoctorServiceAction(
  serviceId: string, 
  data: { name: string; durationMinutes: number; price: number; }
): Promise<ActionResult<DoctorServiceResponse>> {
  return callApi(
    () => springFetch(`/api/schedule/services/${serviceId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    "Failed to update service."
  );
}

export async function deactivateDoctorServiceAction(serviceId: string): Promise<ActionResult<{message: string}>> {
  return callApi(
    () => springFetch(`/api/schedule/services/${serviceId}`, {
      method: "DELETE",
    }),
    "Failed to deactivate service."
  );
}