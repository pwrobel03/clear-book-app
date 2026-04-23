package com.clearbook.api.schedule;

import com.clearbook.api.model.*;
import com.clearbook.api.repository.*;
import com.clearbook.api.schedule.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final AvailabilityBlockRepository blockRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorServiceRepository doctorServiceRepository;
    private final MedicalCenterRepository centerRepository;

    /**
     * DOCTOR LOGIC: Creates a new working block for the doctor.
     */
    @Transactional
    public AvailabilityBlock createWorkingBlock(User doctor, CreateBlockRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        if (blockRepository.existsOverlappingBlock(doctor, request.getStartTime(), request.getEndTime())) {
            throw new IllegalStateException("This working block overlaps with an existing one.");
        }

        MedicalCenter center = centerRepository.findById(request.getCenterId())
                .orElseThrow(() -> new IllegalArgumentException("Medical center not found"));

        AvailabilityBlock block = AvailabilityBlock.builder()
                .doctor(doctor)
                .center(center)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        log.info("Doctor {} created a working block from {} to {}", doctor.getId(), request.getStartTime(), request.getEndTime());
        return blockRepository.save(block);
    }

    /**
     * DOCTOR LOGIC: Fetches working blocks for a specific timeframe.
     */
    @Transactional(readOnly = true)
    public List<AvailabilityBlockResponse> getDoctorBlocks(User doctor, LocalDateTime start, LocalDateTime end) {
        return blockRepository.findByDoctorAndStartTimeBetweenOrderByStartTimeAsc(doctor, start, end)
                .stream()
                .map(block -> AvailabilityBlockResponse.builder()
                        .id(block.getId())
                        .centerId(block.getCenter().getId())
                        .centerName(block.getCenter().getName())
                        .startTime(block.getStartTime())
                        .endTime(block.getEndTime())
                        .build())
                .toList();
    }

    /**
     * PATIENT LOGIC STEP 1: Locks the specific time frame for 15 minutes.
     * Uses PESSIMISTIC LOCKING on the entire block to prevent Race Conditions.
     */
    @Transactional
    public Appointment reserveSlot(User patient, ReserveSlotRequest request) {

        // Pessimistic Lock on the block (other transactions wait here)
        AvailabilityBlock block = blockRepository.findByIdWithPessimisticLock(request.getBlockId())
                .orElseThrow(() -> new IllegalArgumentException("Working block not found."));

        DoctorService service = doctorServiceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new IllegalArgumentException("Service not found."));

        if (!service.isActive() || !service.getDoctor().equals(block.getDoctor())) {
            throw new IllegalArgumentException("Invalid service selected.");
        }

        LocalDateTime calculatedEndTime = request.getStartTime().plusMinutes(service.getDurationMinutes());

        // Validate bounds
        if (request.getStartTime().isBefore(block.getStartTime()) || calculatedEndTime.isAfter(block.getEndTime())) {
            throw new IllegalArgumentException("Requested time is outside the doctor's working hours.");
        }

        // Double-check for overlaps (ignores expired 'RESERVED' slots!)
        if (appointmentRepository.existsOverlappingAppointment(block, request.getStartTime(), calculatedEndTime)) {
            log.warn("Race condition prevented for block {} between {} and {}", block.getId(), request.getStartTime(), calculatedEndTime);
            throw new IllegalStateException("The selected time slot has just been taken.");
        }

        // Create a RESERVED appointment valid for 15 minutes
        Appointment appointment = Appointment.builder()
                .block(block)
                .patient(patient)
                .service(service)
                .startTime(request.getStartTime())
                .endTime(calculatedEndTime)
                .status(AppointmentStatus.RESERVED)
                .reservedUntil(LocalDateTime.now().plusMinutes(15)) // 15 minutes hold!
                .build();

        log.info("Patient {} held a slot with Doctor {} at {} for 15 minutes.", patient.getId(), block.getDoctor().getId(), request.getStartTime());
        return appointmentRepository.save(appointment);
    }

    /**
     * PATIENT LOGIC STEP 2: Confirms the appointment after filling out the form.
     */
    @Transactional
    public Appointment confirmAppointment(User patient, ConfirmAppointmentRequest request) {

        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found."));

        // Validate ownership
        if (!appointment.getPatient().equals(patient)) {
            throw new IllegalStateException("You do not have permission to confirm this appointment.");
        }

        // Check if the hold has expired
        if (appointment.getStatus() == AppointmentStatus.RESERVED &&
                appointment.getReservedUntil() != null &&
                appointment.getReservedUntil().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Your reservation time has expired. Please select the time slot again.");
        }

        // Confirm
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setReservedUntil(null); // Clear the timer
        appointment.setPatientNotes(request.getPatientNotes());

        log.info("Patient {} confirmed appointment {}.", patient.getId(), appointment.getId());
        return appointmentRepository.save(appointment);
    }
}