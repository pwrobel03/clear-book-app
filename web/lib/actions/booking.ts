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
export async function getDoctorServicesAction(identifier: string): Promise<ActionResult<DoctorServiceResponse[]>> {
  return callApi(
    () => springFetch(`/api/schedule/doctors/${identifier}/services`, { 
      method: "GET",
      cache: "no-store"
    }),
    "Failed to fetch doctor services."
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
        cache: "no-store", // Always fetch fresh data for slots in case of recent changes
      }),
    "Failed to fetch available time slots."
  );
}

export async function bookAppointmentAction(data: {
  blockId: string;
  serviceId: string;
  startTime: string; // ISO String, np. "2026-05-10T10:00:00"
  endTime: string;   // ISO String, np. "2026-05-10T10:30:00"
  patientNotes?: string;
}): Promise<ActionResult<any>> {
  return callApi(
    () => springFetch(`/api/schedule/appointments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    "Failed to book appointment. The slot might have just been taken!"
  );
}