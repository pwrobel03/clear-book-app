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

    private final AvailabilityService availabilityService;
    private final AppointmentService appointmentService;
    private final DoctorServiceManager doctorServiceManager;

    // ── Availability blocks ───────────────────────────────────────────────────

    @PostMapping("/blocks")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AvailabilityBlockResponse> createWorkingBlock(
            @AuthenticationPrincipal User doctor,
            @Valid @RequestBody CreateBlockRequest request) {

        return ResponseEntity.ok(availabilityService.createWorkingBlock(doctor, request));
    }

    @GetMapping("/blocks")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<AvailabilityBlockResponse>> getDoctorBlocks(
            @AuthenticationPrincipal User doctor,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        return ResponseEntity.ok(availabilityService.getDoctorBlocks(doctor, start, end));
    }

    @PostMapping("/blocks/copy")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MessageResponse> copyWeekSchedule(
            @AuthenticationPrincipal User doctor,
            @Valid @RequestBody CopyWeekRequest request) {

        availabilityService.copyWeekSchedule(doctor, request);
        return ResponseEntity.ok(new MessageResponse(
                "Schedule copied successfully for " + request.getWeeksToCopy() + " weeks"));
    }

    @DeleteMapping("/blocks/{blockId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MessageResponse> deleteWorkingBlock(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID blockId) {

        availabilityService.deleteWorkingBlock(doctor, blockId);
        return ResponseEntity.ok(new MessageResponse("Working block deleted successfully."));
    }

    @PutMapping("/blocks/{blockId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MessageResponse> updateWorkingBlockTime(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID blockId,
            @Valid @RequestBody UpdateWorkingBlockRequest request) {

        availabilityService.updateWorkingBlockTime(doctor, blockId, request);
        return ResponseEntity.ok(new MessageResponse("Working block updated successfully."));
    }

    @PostMapping("/blocks/clear")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ClearScheduleResponse> clearSchedule(
            @AuthenticationPrincipal User doctor,
            @Valid @RequestBody ClearScheduleRequest request) {

        return ResponseEntity.ok(availabilityService.clearSchedule(doctor, request));
    }

    // ── Doctor services ───────────────────────────────────────────────────────

    @PostMapping("/services")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorServiceResponse> createService(
            @AuthenticationPrincipal User doctor,
            @Valid @RequestBody CreateDoctorServiceRequest request) {

        return ResponseEntity.ok(doctorServiceManager.createService(doctor, request));
    }

    @GetMapping("/services")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<DoctorServiceResponse>> getMyServices(
            @AuthenticationPrincipal User doctor) {

        return ResponseEntity.ok(doctorServiceManager.getMyServices(doctor));
    }

    @PutMapping("/services/{serviceId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorServiceResponse> updateService(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID serviceId,
            @Valid @RequestBody CreateDoctorServiceRequest request) {

        return ResponseEntity.ok(doctorServiceManager.updateService(doctor, serviceId, request));
    }

    @DeleteMapping("/services/{serviceId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MessageResponse> deactivateService(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID serviceId) {

        doctorServiceManager.deactivateService(doctor, serviceId);
        return ResponseEntity.ok(new MessageResponse("Service deactivated successfully."));
    }

    // ── Public (no auth) ──────────────────────────────────────────────────────

    @GetMapping("/doctors/{publicId}/slots")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlots(
            @PathVariable String publicId,
            @RequestParam UUID serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        return ResponseEntity.ok(appointmentService.getAvailableSlots(publicId, serviceId, start, end));
    }

    @GetMapping("/doctors/{publicId}/services")
    public ResponseEntity<List<DoctorServiceResponse>> getDoctorServices(
            @PathVariable String publicId) {

        return ResponseEntity.ok(doctorServiceManager.getDoctorServices(publicId));
    }

    // ── Patient appointments ──────────────────────────────────────────────────

    @PostMapping("/reserve")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AppointmentResponse> reserveSlot(
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody ReserveSlotRequest request) {

        return ResponseEntity.ok(appointmentService.reserveSlot(patient, request));
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AppointmentResponse> confirmAppointment(
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody ConfirmAppointmentRequest request) {

        return ResponseEntity.ok(appointmentService.confirmAppointment(patient, request));
    }

    @PostMapping("/appointments")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AppointmentResponse> bookAppointment(
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody BookAppointmentRequest request) {

        return ResponseEntity.ok(appointmentService.bookAppointment(patient, request));
    }

    @GetMapping("/my-appointments")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Page<AppointmentResponse>> getMyAppointments(
            @AuthenticationPrincipal User patient,
            @RequestParam(required = false) AppointmentStatus status,
            @PageableDefault(size = 10) Pageable pageable) {

        return ResponseEntity.ok(appointmentService.getPatientAppointments(patient, status, pageable));
    }

    @GetMapping("/my-appointments/{appointmentId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AppointmentResponse> getAppointmentDetails(
            @AuthenticationPrincipal User patient,
            @PathVariable UUID appointmentId) {

        return ResponseEntity.ok(appointmentService.getAppointmentDetails(patient, appointmentId));
    }

    @PostMapping("/my-appointments/{appointmentId}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @AuthenticationPrincipal User patient,
            @PathVariable UUID appointmentId) {

        return ResponseEntity.ok(appointmentService.cancelAppointment(patient, appointmentId));
    }

    // ── Doctor appointments ───────────────────────────────────────────────────

    @GetMapping("/doctor-appointments")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Page<AppointmentResponse>> getDoctorAppointments(
            @AuthenticationPrincipal User doctor,
            @RequestParam(required = false) AppointmentStatus status,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctor, status, pageable));
    }

    @GetMapping("/doctor-appointments/{appointmentId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AppointmentResponse> getDoctorAppointmentDetails(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID appointmentId) {

        return ResponseEntity.ok(appointmentService.getDoctorAppointmentDetails(doctor, appointmentId));
    }

    @PostMapping("/doctor-appointments/{appointmentId}/cancel")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AppointmentResponse> cancelAppointmentByDoctor(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody DoctorCancelRequest request) {

        return ResponseEntity.ok(
                appointmentService.cancelAppointmentByDoctor(doctor, appointmentId, request.getReason()));
    }

    @PostMapping("/doctor-appointments/{appointmentId}/no-show")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AppointmentResponse> markAppointmentAsNoShow(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID appointmentId) {

        return ResponseEntity.ok(appointmentService.markAsNoShow(doctor, appointmentId));
    }
}
