package com.clearbook.api.schedule;

import com.clearbook.api.model.User;
import com.clearbook.api.schedule.dto.*;
import com.clearbook.api.shared.dto.MessageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    @PreAuthorize("hasRole('PATIENT')")
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
    @PreAuthorize("hasRole('PATIENT')")
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
}