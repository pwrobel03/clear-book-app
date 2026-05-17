"use server";

import { springFetch } from "@/lib/server/spring";
import { callApi } from "@/lib/server/api-action";
import type { ActionResult } from "@/types/api";

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
  startTime: string; 
  endTime: string;   
};

export type AppointmentStatus = "SCHEDULED" | "RESERVED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export type AppointmentResponse = {
  id: string;
  blockId: string;
  patientId: string;
  patientFirstName?: string; // Ważne dla widoku lekarza
  patientLastName?: string;  // Ważne dla widoku lekarza
  serviceId: string;
  serviceName: string;
  serviceDurationMinutes: number;
  doctorFirstName: string;
  doctorLastName: string;
  doctorPublicId: string;
  centerId: string;
  centerName: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reservedUntil: string | null;
  patientNotes: string | null;
  doctorNotes: string | null;
  createdAt: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function getDoctorServicesAction(identifier: string): Promise<ActionResult<DoctorServiceResponse[]>> {
  return callApi(() => springFetch(`/api/schedule/doctors/${identifier}/services`, { method: "GET", cache: "no-store" }), "Failed to fetch doctor services.");
}

export async function getAvailableSlotsAction(doctorId: string, serviceId: string, startIso: string, endIso: string): Promise<ActionResult<AvailableSlotResponse[]>> {
  const query = new URLSearchParams({ serviceId, start: startIso, end: endIso }).toString();
  return callApi<AvailableSlotResponse[]>(() => springFetch(`/api/schedule/doctors/${doctorId}/slots?${query}`, { method: "GET", cache: "no-store" }), "Failed to fetch available time slots.");
}

export async function bookAppointmentAction(data: { blockId: string; serviceId: string; startTime: string; endTime: string; patientNotes?: string; }): Promise<ActionResult<AppointmentResponse>> {
  return callApi(() => springFetch(`/api/schedule/appointments`, { method: "POST", body: JSON.stringify(data) }), "Failed to book appointment.");
}

export async function confirmAppointmentAction(appointmentId: string, patientNotes?: string): Promise<ActionResult<AppointmentResponse>> {
  return callApi<AppointmentResponse>(() => springFetch(`/api/schedule/confirm`, { method: "POST", body: JSON.stringify({ appointmentId, patientNotes }) }), "Nie udało się potwierdzić wizyty.");
}

export async function getAppointmentAction(appointmentId: string, userRole: string = "USER"): Promise<ActionResult<AppointmentResponse>> {
  const endpoint = userRole === "DOCTOR" ? `/api/schedule/doctor-appointments/${appointmentId}` : `/api/schedule/my-appointments/${appointmentId}`;
  return callApi<AppointmentResponse>(() => springFetch(endpoint, { method: "GET", cache: "no-store" }), "Nie udało się pobrać szczegółów wizyty.");
}

// --- AKCJE LISTY (PACJENT I LEKARZ) ---

export async function getMyAppointmentsAction(params?: { status?: AppointmentStatus; page?: number; size?: number; sort?: string }): Promise<ActionResult<PageResponse<AppointmentResponse>>> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));
  if (params?.sort) query.set("sort", params.sort);

  return callApi<PageResponse<AppointmentResponse>>(() => springFetch(`/api/schedule/my-appointments?${query.toString()}`, { method: "GET", cache: "no-store" }), "Failed to fetch your appointments.");
}

export async function getDoctorAppointmentsListAction(params?: { status?: AppointmentStatus; page?: number; size?: number; sort?: string }): Promise<ActionResult<PageResponse<AppointmentResponse>>> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.size !== undefined) query.set("size", String(params.size));
  if (params?.sort) query.set("sort", params.sort);

  return callApi<PageResponse<AppointmentResponse>>(() => springFetch(`/api/schedule/doctor-appointments?${query.toString()}`, { method: "GET", cache: "no-store" }), "Failed to fetch doctor appointments.");
}

// --- AKCJE ZARZĄDZANIA WIZYTĄ ---

export async function cancelAppointmentAction(appointmentId: string): Promise<ActionResult<{ message: string }>> {
  return callApi(() => springFetch(`/api/schedule/my-appointments/${appointmentId}/cancel`, { method: "POST" }), "Failed to cancel appointment.");
}

export async function cancelByDoctorAction(appointmentId: string, reason: string): Promise<ActionResult<AppointmentResponse>> {
  return callApi<AppointmentResponse>(() => springFetch(`/api/schedule/doctor-appointments/${appointmentId}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }), "Nie udało się odwołać wizyty.");
}

export async function markAsNoShowAction(appointmentId: string): Promise<ActionResult<AppointmentResponse>> {
  return callApi<AppointmentResponse>(() => springFetch(`/api/schedule/doctor-appointments/${appointmentId}/no-show`, { method: "POST" }), "Nie udało się zmienić statusu.");
}