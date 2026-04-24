"use server";

import { springFetch } from "@/lib/server/spring";
import { callApi } from "@/lib/server/api-action";
import type { ActionResult } from "@/types/api";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DoctorServiceResponse = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

export type AvailableSlotResponse = {
  blockId: string;
  centerId: string;
  centerName: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUBLIC: Fetches all services offered by a specific doctor.
 */
export async function getDoctorServicesAction(
  doctorId: string
): Promise<ActionResult<DoctorServiceResponse[]>> {
  return callApi<DoctorServiceResponse[]>(
    () =>
      springFetch(`/api/schedule/doctors/${doctorId}/services`, {
        method: "GET",
      }),
    "Failed to fetch doctor's services."
  );
}

/**
 * PUBLIC: Fetches dynamically calculated virtual slots for a doctor, 
 * bounded by the selected service duration and dates.
 */
export async function getAvailableSlotsAction(
  doctorId: string,
  serviceId: string,
  startIso: string,
  endIso: string
): Promise<ActionResult<AvailableSlotResponse[]>> {
  // Construct the URL with query parameters
  const query = new URLSearchParams({
    serviceId,
    start: startIso,
    end: endIso,
  }).toString();

  return callApi<AvailableSlotResponse[]>(
    () =>
      springFetch(`/api/schedule/doctors/${doctorId}/slots?${query}`, {
        method: "GET",
      }),
    "Failed to fetch available time slots."
  );
}