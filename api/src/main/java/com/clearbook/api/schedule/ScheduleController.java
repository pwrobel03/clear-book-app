package com.clearbook.api.schedule;

import com.clearbook.api.model.Appointment;
import com.clearbook.api.model.AvailabilityBlock;
import com.clearbook.api.model.User;
import com.clearbook.api.schedule.dto.BookAppointmentRequest;
import com.clearbook.api.schedule.dto.ConfirmAppointmentRequest;
import com.clearbook.api.schedule.dto.CreateBlockRequest;
import com.clearbook.api.schedule.dto.ReserveSlotRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

        AvailabilityBlock block = scheduleService.createWorkingBlock(doctor, request);

        return ResponseEntity.ok(Map.of(
                "message", "Working block created successfully",
                "blockId", block.getId()
        ));
    }

    /**
     * PATIENT LOGIC STEP 1: Holds a time slot for 15 minutes.
     * Only users with the PATIENT role can access this.
     */
    @PostMapping("/reserve")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> reserveSlot(
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody ReserveSlotRequest request) {

        Appointment reservation = scheduleService.reserveSlot(patient, request);

        return ResponseEntity.ok(Map.of(
                "message", "Slot reserved for 15 minutes",
                "appointmentId", reservation.getId(),
                "reservedUntil", reservation.getReservedUntil()
        ));
    }

    /**
     * PATIENT LOGIC STEP 2: Confirms the reserved appointment.
     */
    @PostMapping("/confirm")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> confirmAppointment(
            @AuthenticationPrincipal User patient,
            @Valid @RequestBody ConfirmAppointmentRequest request) {

        Appointment confirmedAppointment = scheduleService.confirmAppointment(patient, request);

        return ResponseEntity.ok(Map.of(
                "message", "Appointment confirmed successfully",
                "appointmentId", confirmedAppointment.getId(),
                "status", confirmedAppointment.getStatus()
        ));
    }
}