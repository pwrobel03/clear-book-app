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

export type AppointmentStatus =
  | "SCHEDULED"
  | "RESERVED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type AppointmentResponse = {
  id: string;
  blockId: string;
  patientId: string;
  serviceId: string;
  serviceName: string;
  serviceDurationMinutes: number;
  doctorFirstName: string;
  doctorLastName: string;
  centerName: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reservedUntil: string | null;
  patientNotes: string | null;
  createdAt: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-indexed)
  size: number;
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
}): Promise<ActionResult<AppointmentResponse>> {
  return callApi(
    () => springFetch(`/api/schedule/appointments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    "Failed to book appointment. The slot might have just been taken!"
  );
}

/**
 * PATIENT: Fetches the current patient's appointments with optional status filter and pagination.
 */
export async function getMyAppointmentsAction(params?: {
  status?: AppointmentStatus;
  page?: number;
  size?: number;
}): Promise<ActionResult<PageResponse<AppointmentResponse>>> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));

  const qs = query.toString();
  return callApi<PageResponse<AppointmentResponse>>(
    () =>
      springFetch(`/api/schedule/my-appointments${qs ? `?${qs}` : ""}`, {
        method: "GET",
        cache: "no-store",
      }),
    "Failed to fetch your appointments."
  );
}

/**
 * PATIENT: Cancels an appointment by ID.
 */
export async function cancelAppointmentAction(
  appointmentId: string
): Promise<ActionResult<{ message: string }>> {
  return callApi(
    () =>
      springFetch(
        `/api/schedule/my-appointments/${appointmentId}/cancel`,
        { method: "POST" }
      ),
    "Failed to cancel appointment."
  );
}

/**
 * Pobiera szczegóły konkretnej wizyty na podstawie jej ID.
 * (Teraz uderza w nowy endpoint, który dodaliśmy do kontrolera)
 */
export async function getAppointmentAction(
  appointmentId: string
): Promise<ActionResult<AppointmentResponse>> {
  return callApi<AppointmentResponse>(
    () => springFetch(`/api/schedule/my-appointments/${appointmentId}`, { 
      method: "GET",
      cache: "no-store" 
    }),
    "Nie udało się pobrać szczegółów wizyty."
  );
}

/**
 * Potwierdza wizytę (zmienia status z RESERVED na SCHEDULED) i zapisuje notatkę pacjenta.
 * (Dopasowane do @PostMapping("/confirm") z Twojego kontrolera)
 */
export async function confirmAppointmentAction(
  appointmentId: string,
  patientNotes?: string
): Promise<ActionResult<AppointmentResponse>> {
  return callApi<AppointmentResponse>(
    () => springFetch(`/api/schedule/confirm`, {
      method: "POST",
      // Zakładam, że Twoja klasa ConfirmAppointmentRequest w Javie przyjmuje te dwa pola
      body: JSON.stringify({ appointmentId, patientNotes }),
    }),
    "Nie udało się potwierdzić wizyty. Upewnij się, że czas rezerwacji nie minął."
  );
}