package com.clearbook.api.schedule;

import com.clearbook.api.model.*;
import com.clearbook.api.repository.*;
import com.clearbook.api.schedule.dto.BookAppointmentRequest;
import com.clearbook.api.schedule.dto.CreateBlockRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
     * Validates that the doctor doesn't overlap their own working hours.
     */
    @Transactional
    public AvailabilityBlock createWorkingBlock(User doctor, CreateBlockRequest request) {

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        boolean isOverlapping = blockRepository.existsOverlappingBlock(
                doctor, request.getStartTime(), request.getEndTime());

        if (isOverlapping) {
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
     * PATIENT LOGIC: Books an appointment.
     * Uses PESSIMISTIC LOCKING to prevent Race Conditions.
     */
    @Transactional
    public Appointment bookAppointment(User patient, BookAppointmentRequest request) {

        // Fetch the block and LOCK it.
        // If Patient A and Patient B click "Book" at the exact same millisecond,
        // the database will force Patient B's transaction to wait right here until Patient A finishes.
        AvailabilityBlock block = blockRepository.findByIdWithPessimisticLock(request.getBlockId())
                .orElseThrow(() -> new IllegalArgumentException("Working block not found."));

        // Fetch the selected service to determine the appointment duration
        DoctorService service = doctorServiceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new IllegalArgumentException("Service not found."));

        if (!service.isActive() || !service.getDoctor().equals(block.getDoctor())) {
            throw new IllegalArgumentException("Invalid service selected.");
        }

        LocalDateTime calculatedEndTime = request.getStartTime().plusMinutes(service.getDurationMinutes());

        // Validate that the requested time fits entirely within the working block
        if (request.getStartTime().isBefore(block.getStartTime()) || calculatedEndTime.isAfter(block.getEndTime())) {
            throw new IllegalArgumentException("Requested appointment time is outside the doctor's working hours.");
        }

        // Double-check for overlapping appointments.
        boolean isOverlapping = appointmentRepository.existsOverlappingAppointment(
                block, request.getStartTime(), calculatedEndTime);

        if (isOverlapping) {
            log.warn("Race condition prevented! Block {} was already taken between {} and {}",
                    block.getId(), request.getStartTime(), calculatedEndTime);
            throw new IllegalStateException("The selected time slot has just been taken by someone else.");
        }

        // Safe to save
        Appointment appointment = Appointment.builder()
                .block(block)
                .patient(patient)
                .service(service)
                .startTime(request.getStartTime())
                .endTime(calculatedEndTime)
                .patientNotes(request.getPatientNotes())
                .status(AppointmentStatus.SCHEDULED)
                // We could set reservedUntil here if implementing a multi-step checkout
                .build();

        log.info("Patient {} successfully booked an appointment with Doctor {} at {}",
                patient.getId(), block.getDoctor().getId(), request.getStartTime());

        return appointmentRepository.save(appointment);
    }
}