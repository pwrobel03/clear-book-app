package com.clearbook.api.schedule;

import com.clearbook.api.model.AppointmentStatus;
import com.clearbook.api.model.User;
import com.clearbook.api.schedule.dto.*;
import com.clearbook.api.shared.dto.MessageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    /**
     * DOCTOR LOGIC: Creates a new working block.
     * Only users with the DOCTOR role can access this.
     */
    @PostMapping("/blocks")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> createWorkingBlock(
            @AuthenticationPrincipal User doctor,
            @Valid @RequestBody CreateBlockRequest request) {

        AvailabilityBlockResponse block = scheduleService.createWorkingBlock(doctor, request);
        return ResponseEntity.ok(block);
    }

    /**
     * PATIENT LOGIC: Holds a time slot for 15 minutes.
     * Only users with the PATIENT role can access this.
     */
    @PostMapping("/reserve")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> reserveSlot(
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody ReserveSlotRequest request) {

        AppointmentResponse reservation = scheduleService.reserveSlot(patient, request);
        return ResponseEntity.ok(reservation);
    }

    /**
     * PATIENT LOGIC: Confirms the reserved appointment.
     */
    @PostMapping("/confirm")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> confirmAppointment(
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody ConfirmAppointmentRequest request) {

        AppointmentResponse confirmedAppointment = scheduleService.confirmAppointment(patient, request);
        return ResponseEntity.ok(confirmedAppointment);
    }

    /**
     * DOCTOR: Fetches the doctor's working blocks in a given timeframe.
     */
    @GetMapping("/blocks")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<AvailabilityBlockResponse>> getDoctorBlocks(
            @AuthenticationPrincipal User doctor,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<AvailabilityBlockResponse> blocks = scheduleService.getDoctorBlocks(doctor, start, end);
        return ResponseEntity.ok(blocks);
    }

    /**
     * DOCTOR: Copies schedule from one week to future weeks.
     */
    @PostMapping("/blocks/copy")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> copyWeekSchedule(
            @AuthenticationPrincipal User doctor,
            @Valid @RequestBody CopyWeekRequest request) {

        scheduleService.copyWeekSchedule(doctor, request);
        return ResponseEntity.ok(new MessageResponse(
                "Schedule copied successfully for " + request.getWeeksToCopy() + " weeks"));
    }

    /**
     * DOCTOR: Deletes a working block and cancels associated appointments.
     */
    @DeleteMapping("/blocks/{blockId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> deleteWorkingBlock(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID blockId) {

        scheduleService.deleteWorkingBlock(doctor, blockId);
        return ResponseEntity.ok(new MessageResponse("Working block and associated appointments deleted successfully."));
    }

    /**
     * DOCTOR: Updates a working block's timeframe (Safe Shrink).
     */
    @PutMapping("/blocks/{blockId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> updateWorkingBlockTime(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID blockId,
            @Valid @RequestBody UpdateWorkingBlockRequest request) {

        scheduleService.updateWorkingBlockTime(doctor, blockId, request);
        return ResponseEntity.ok(new MessageResponse("Working block updated successfully."));
    }

    /**
     * DOCTOR: Clears all working blocks (and cancels their appointments) within a date range.
     * Optionally scoped to a specific center via centerId in the request body.
     */
    @PostMapping("/blocks/clear")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ClearScheduleResponse> clearSchedule(
            @AuthenticationPrincipal User doctor,
            @Valid @RequestBody ClearScheduleRequest request) {

        ClearScheduleResponse result = scheduleService.clearSchedule(doctor, request);
        return ResponseEntity.ok(result);
    }

    // ── DOCTOR SERVICE MANAGEMENT ──

    /**
     * DOCTOR: Creates a new service offering.
     */
    @PostMapping("/services")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorServiceResponse> createService(
            @AuthenticationPrincipal User doctor,
            @Valid @RequestBody CreateDoctorServiceRequest request) {

        DoctorServiceResponse service = scheduleService.createDoctorService(doctor, request);
        return ResponseEntity.ok(service);
    }

    /**
     * DOCTOR: Returns all services (including inactive) for the authenticated doctor.
     */
    @GetMapping("/services")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<DoctorServiceResponse>> getMyServices(
            @AuthenticationPrincipal User doctor) {

        List<DoctorServiceResponse> services = scheduleService.getMyServices(doctor);
        return ResponseEntity.ok(services);
    }

    /**
     * DOCTOR: Updates an existing service.
     */
    @PutMapping("/services/{serviceId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorServiceResponse> updateService(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID serviceId,
            @Valid @RequestBody CreateDoctorServiceRequest request) {

        DoctorServiceResponse updated = scheduleService.updateDoctorService(doctor, serviceId, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * DOCTOR: Deactivates a service (soft delete).
     */
    @DeleteMapping("/services/{serviceId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MessageResponse> deactivateService(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID serviceId) {

        scheduleService.deactivateDoctorService(doctor, serviceId);
        return ResponseEntity.ok(new MessageResponse("Service deactivated successfully."));
    }

    // ── PUBLIC ENDPOINTS (no authentication required) ──

    /**
     * PUBLIC: Returns available time slots for a specific doctor and service.
     * These are virtual slots dynamically calculated from AvailabilityBlocks minus existing appointments.
     * No authentication required — this is what the patient sees on the booking page.
     */
    @GetMapping("/doctors/{doctorId}/slots")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlots(
            @PathVariable UUID doctorId,
            @RequestParam UUID serviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        List<AvailableSlotResponse> slots = scheduleService.getAvailableSlots(doctorId, serviceId, start, end);
        return ResponseEntity.ok(slots);
    }

    /**
     * PUBLIC: Returns all active services offered by a specific doctor.
     * Used by patients to choose a service before seeing available time slots.
     */
    @GetMapping("/doctors/{doctorId}/services")
    public ResponseEntity<List<DoctorServiceResponse>> getDoctorServices(
            @PathVariable UUID doctorId) {

        List<DoctorServiceResponse> services = scheduleService.getDoctorServices(doctorId);
        return ResponseEntity.ok(services);
    }

    // ── PATIENT ENDPOINTS ──

    /**
     * PATIENT: Returns paginated list of the patient's appointments.
     * Optionally filtered by status query param (e.g., ?status=SCHEDULED).
     */
    @GetMapping("/my-appointments")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<AppointmentResponse>> getMyAppointments(
            @AuthenticationPrincipal User patient,
            @RequestParam(required = false) AppointmentStatus status,
            @PageableDefault(size = 10) Pageable pageable) {

        Page<AppointmentResponse> appointments = scheduleService.getPatientAppointments(patient, status, pageable);
        return ResponseEntity.ok(appointments);
    }

    /**
     * PATIENT: Cancels an appointment.
     * Only SCHEDULED or RESERVED appointments can be cancelled.
     */
    @PostMapping("/my-appointments/{appointmentId}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @AuthenticationPrincipal User patient,
            @PathVariable UUID appointmentId) {

        AppointmentResponse cancelled = scheduleService.cancelAppointment(patient, appointmentId);
        return ResponseEntity.ok(cancelled);
    }

    /**
     * PATIENT: Books an appointment (soft lock for 15 minutes).
     */
    @PostMapping("/appointments")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AppointmentResponse> bookAppointment(
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody BookAppointmentRequest request) {

        AppointmentResponse response = scheduleService.bookAppointment(patient, request);
        return ResponseEntity.ok(response);
    }

    // ── DOCTOR APPOINTMENT ENDPOINTS ──

    /**
     * DOCTOR: Returns paginated list of all appointments across the doctor's blocks.
     * Optionally filtered by status.
     */
    @GetMapping("/doctor-appointments")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Page<AppointmentResponse>> getDoctorAppointments(
            @AuthenticationPrincipal User doctor,
            @RequestParam(required = false) AppointmentStatus status,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<AppointmentResponse> appointments = scheduleService.getDoctorAppointments(doctor, status, pageable);
        return ResponseEntity.ok(appointments);
    }
}