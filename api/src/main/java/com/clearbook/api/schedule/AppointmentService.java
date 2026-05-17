package com.clearbook.api.schedule;

import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.*;
import com.clearbook.api.notification.NotificationEvent;
import com.clearbook.api.repository.*;
import com.clearbook.api.schedule.dto.*;
import com.clearbook.api.schedule.event.AppointmentCancelledEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Handles all appointment lifecycle operations for both patients and doctors:
 * slot reservation, confirmation, booking, cancellation, and no-show marking.
 *
 * Race-condition safety is enforced at the database level via pessimistic locking
 * inside {@link #reserveSlot} and {@link #bookAppointment}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilityBlockRepository blockRepository;
    private final DoctorServiceRepository doctorServiceRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ── Public slot browsing ─────────────────────────────────────────────────

    /**
     * Returns all available time slots for a given doctor and service within the
     * requested range. Read-only — no locking needed here.
     *
     * Algorithm:
     * 1. Resolve doctor by publicId.
     * 2. Validate the requested service.
     * 3. For each future availability block, walk through in service-duration increments
     *    and skip slots that overlap with existing (non-expired) appointments.
     */
    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlots(String publicId, UUID serviceId,
                                                         LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        DoctorProfile profile = doctorProfileRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found for publicId: " + publicId));

        UUID doctorId = profile.getUser().getId();

        DoctorService service = doctorServiceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found."));

        if (!service.isActive() || !service.getDoctor().getId().equals(doctorId)) {
            throw new IllegalArgumentException("Invalid service for this doctor.");
        }

        int duration = service.getDurationMinutes();
        LocalDateTime now = LocalDateTime.now();

        if (rangeStart == null) rangeStart = now;
        if (rangeEnd == null)   rangeEnd = rangeStart.plusMonths(1);

        List<AvailabilityBlock> futureBlocks = blockRepository.findFutureBlocksByDoctorId(
                doctorId, now, rangeStart, rangeEnd);

        List<AvailableSlotResponse> slots = new ArrayList<>();

        for (AvailabilityBlock block : futureBlocks) {
            List<Appointment> occupied = appointmentRepository.findActiveAppointmentsByBlock(block);

            LocalDateTime cursor = block.getStartTime();

            // If the block has already started, advance to the next rounded 5-minute mark
            if (cursor.isBefore(now)) {
                cursor = now.plusMinutes(1);
                int remainder = cursor.getMinute() % 5;
                if (remainder != 0) cursor = cursor.plusMinutes(5 - remainder);
                cursor = cursor.withSecond(0).withNano(0);
            }

            while (!cursor.plusMinutes(duration).isAfter(block.getEndTime())) {
                LocalDateTime slotEnd = cursor.plusMinutes(duration);
                boolean isOccupied = false;

                for (Appointment app : occupied) {
                    boolean isExpiredReservation = app.getStatus() == AppointmentStatus.RESERVED
                            && app.getReservedUntil() != null
                            && app.getReservedUntil().isBefore(now);

                    if (isExpiredReservation) continue;

                    if (cursor.isBefore(app.getEndTime()) && slotEnd.isAfter(app.getStartTime())) {
                        isOccupied = true;
                        break;
                    }
                }

                if (!isOccupied) {
                    slots.add(AvailableSlotResponse.builder()
                            .blockId(block.getId())
                            .centerId(block.getCenter().getId())
                            .centerName(block.getCenter().getName())
                            .startTime(cursor)
                            .endTime(slotEnd)
                            .build());
                }

                cursor = cursor.plusMinutes(duration);
            }
        }

        return slots;
    }

    // ── Patient: booking flow ─────────────────────────────────────────────────

    /**
     * Step 1: Acquires a 15-minute pessimistic hold on a slot.
     * Uses a database-level lock on the availability block to prevent race conditions.
     */
    @Transactional
    public AppointmentResponse reserveSlot(User patient, ReserveSlotRequest request) {
        if (!request.getStartTime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot reserve a time slot in the past.");
        }

        // Pessimistic lock — concurrent transactions block here until we commit
        AvailabilityBlock block = blockRepository.findByIdWithPessimisticLock(request.getBlockId())
                .orElseThrow(() -> new ResourceNotFoundException("Working block not found."));

        DoctorService service = doctorServiceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found."));

        if (!service.isActive() || !service.getDoctor().equals(block.getDoctor())) {
            throw new IllegalArgumentException("Invalid service selected.");
        }

        LocalDateTime calculatedEnd = request.getStartTime().plusMinutes(service.getDurationMinutes());

        if (request.getStartTime().isBefore(block.getStartTime())
                || calculatedEnd.isAfter(block.getEndTime())) {
            throw new IllegalArgumentException("Requested time is outside the doctor's working hours.");
        }

        if (appointmentRepository.existsOverlappingAppointment(block, request.getStartTime(), calculatedEnd)) {
            log.warn("Race condition prevented for block {} between {} and {}",
                    block.getId(), request.getStartTime(), calculatedEnd);
            throw new IllegalStateException("The selected time slot has just been taken.");
        }

        Appointment appointment = Appointment.builder()
                .block(block)
                .patient(patient)
                .service(service)
                .startTime(request.getStartTime())
                .endTime(calculatedEnd)
                .status(AppointmentStatus.RESERVED)
                .reservedUntil(LocalDateTime.now().plusMinutes(15))
                .build();

        log.info("Patient {} held a slot with Doctor {} at {} for 15 minutes.",
                patient.getId(), block.getDoctor().getId(), request.getStartTime());
        return toResponse(appointmentRepository.save(appointment));
    }

    /**
     * Step 2: Confirms a RESERVED appointment after the patient fills in their details.
     * Fails if the 15-minute hold has expired.
     */
    @Transactional
    public AppointmentResponse confirmAppointment(User patient, ConfirmAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getPatient().equals(patient)) {
            throw new ForbiddenException("You do not have permission to confirm this appointment.");
        }
        if (appointment.getStatus() != AppointmentStatus.RESERVED) {
            throw new IllegalStateException("This appointment cannot be confirmed (status: "
                    + appointment.getStatus() + ").");
        }
        if (appointment.getReservedUntil() != null
                && appointment.getReservedUntil().isBefore(LocalDateTime.now())) {
            appointmentRepository.delete(appointment);
            throw new IllegalStateException("Your reservation time has expired. Please select the time slot again.");
        }

        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setReservedUntil(null);
        appointment.setPatientNotes(request.getPatientNotes());

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Patient {} confirmed appointment {}.", patient.getId(), savedAppointment.getId());

        String message = String.format("Patient %s %s has reserved a new appointment on %s at %s.",
                        patient.getFirstName(),
                        patient.getLastName(),
                        savedAppointment.getDate(),
                        savedAppointment.getStartTime());

        eventPublisher.publishEvent(new NotificationEvent(
            savedAppointment.getBlock().getDoctor(),
            "📅 New appointment reservation",
            message
        ));

        return toResponse(savedAppointment);
    }

    /**
     * Direct booking — creates a RESERVED appointment in a single step.
     * The patient must still confirm via {@link #confirmAppointment} within 15 minutes.
     * Uses pessimistic locking identical to {@link #reserveSlot}.
     */
    @Transactional
    public AppointmentResponse bookAppointment(User patient, BookAppointmentRequest request) {
        if (!request.getStartTime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot book an appointment in the past.");
        }

        // Pessimistic lock — same protection as reserveSlot
        AvailabilityBlock block = blockRepository.findByIdWithPessimisticLock(request.getBlockId())
                .orElseThrow(() -> new ResourceNotFoundException("Working block not found."));

        DoctorService service = doctorServiceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found."));

        if (!service.isActive()) {
            throw new IllegalStateException("This service is no longer active.");
        }
        if (!service.getDoctor().equals(block.getDoctor())) {
            throw new IllegalArgumentException("This service does not belong to the block's doctor.");
        }

        LocalDateTime start = request.getStartTime();
        LocalDateTime end = request.getEndTime();

        if (start.isBefore(block.getStartTime()) || end.isAfter(block.getEndTime())) {
            throw new IllegalArgumentException("Appointment time is outside the working block.");
        }
        if (appointmentRepository.existsOverlappingAppointment(block, start, end)) {
            log.warn("Race condition prevented in bookAppointment for block {} between {} and {}",
                    block.getId(), start, end);
            throw new IllegalStateException("This time slot has already been taken by someone else.");
        }

        Appointment appointment = Appointment.builder()
                .block(block)
                .patient(patient)
                .service(service)
                .startTime(start)
                .endTime(end)
                .status(AppointmentStatus.RESERVED)
                .reservedUntil(LocalDateTime.now().plusMinutes(15))
                .patientNotes(request.getPatientNotes())
                .build();

        return toResponse(appointmentRepository.save(appointment));
    }

    // ── Patient: read & cancel ────────────────────────────────────────────────

    /**
     * Returns a paginated list of the patient's appointments, optionally filtered by status.
     */
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getPatientAppointments(User patient, AppointmentStatus status,
                                                            Pageable pageable) {
        return appointmentRepository.findByPatient(patient, status, pageable).map(this::toResponse);
    }

    /**
     * Returns details of a single appointment owned by the patient.
     */
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentDetails(User patient, UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getPatient().equals(patient)) {
            throw new ForbiddenException("You do not have permission to view this appointment.");
        }
        return toResponse(appointment);
    }

    /**
     * Allows a patient to cancel their own SCHEDULED or RESERVED appointment.
     */
    @Transactional
    public AppointmentResponse cancelAppointment(User patient, UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getPatient().equals(patient)) {
            throw new ForbiddenException("You do not have permission to cancel this appointment.");
        }
        if (appointment.getStatus() != AppointmentStatus.SCHEDULED
                && appointment.getStatus() != AppointmentStatus.RESERVED) {
            throw new IllegalStateException(
                    "Cannot cancel appointment with status: " + appointment.getStatus() + ".");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setReservedUntil(null);

        log.info("Patient {} cancelled appointment {}.", patient.getId(), appointmentId);

        String message = String.format(
                "Patient %s %s has cancelled their appointment scheduled for %s. You now have an available slot in your schedule.",
                patient.getFirstName(),
                patient.getLastName(),
                appointment.getDate());

        eventPublisher.publishEvent(new NotificationEvent(
                appointment.getBlock().getDoctor(),
                "ℹ️ Appointment Cancellation",
                message
        ));

        return toResponse(appointmentRepository.save(appointment));
    }

    // ── Doctor: read & status management ─────────────────────────────────────

    /**
     * Returns a paginated list of all appointments across the doctor's blocks,
     * optionally filtered by status.
     */
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getDoctorAppointments(User doctor, AppointmentStatus status,
                                                           Pageable pageable) {
        return appointmentRepository.findByDoctor(doctor, status, pageable).map(this::toResponse);
    }

    /**
     * Returns details of a single appointment belonging to the doctor.
     */
    @Transactional(readOnly = true)
    public AppointmentResponse getDoctorAppointmentDetails(User doctor, UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getBlock().getDoctor().equals(doctor)) {
            throw new ForbiddenException("You do not have permission to view this appointment.");
        }
        return toResponse(appointment);
    }

    /**
     * Allows a doctor to cancel an appointment and record a reason.
     * The patient is notified by e-mail after the transaction commits.
     */
    @Transactional
    public AppointmentResponse cancelAppointmentByDoctor(User doctor, UUID appointmentId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getBlock().getDoctor().equals(doctor)) {
            throw new ForbiddenException("You do not have permission to modify this appointment.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("This appointment is already cancelled.");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed appointment.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setDoctorNotes(reason);
        appointment.setReservedUntil(null);

        Appointment saved = appointmentRepository.save(appointment);
        publishCancellationEvent(saved, reason);

        log.info("Doctor {} cancelled appointment {} with reason: {}", doctor.getId(), appointmentId, reason);

        String message = String.format(
                "Doctor %s %s had to cancel your appointment scheduled for %s. We apologize for any inconvenience.",
                doctor.getFirstName(),
                doctor.getLastName(),
                appointment.getDate());

        eventPublisher.publishEvent(new NotificationEvent(
                appointment.getPatient(),
                "❌ Appointment has been cancelled.",
                message
        ));

        return toResponse(saved);
    }

    /**
     * Marks an appointment as NO_SHOW.
     * Only allowed within 15 minutes of the appointment's start time.
     */
    @Transactional
    public AppointmentResponse markAsNoShow(User doctor, UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getBlock().getDoctor().equals(doctor)) {
            throw new ForbiddenException("You do not have permission to modify this appointment.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(appointment.getStartTime())) {
            throw new IllegalStateException("You cannot mark an appointment as NO_SHOW before it starts.");
        }
        if (now.isAfter(appointment.getStartTime().plusMinutes(15))) {
            throw new IllegalStateException(
                    "You can only mark an appointment as NO_SHOW within 15 minutes of its start time.");
        }

        appointment.setStatus(AppointmentStatus.NO_SHOW);
        appointment.setReservedUntil(null);

        log.info("Doctor {} marked appointment {} as NO_SHOW.", doctor.getId(), appointmentId);
        return toResponse(appointmentRepository.save(appointment));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void publishCancellationEvent(Appointment app, String reason) {
        eventPublisher.publishEvent(new AppointmentCancelledEvent(
                this,
                app.getPatient().getEmail(),
                app.getPatient().getFirstName(),
                app.getBlock().getDoctor().getFirstName(),
                app.getBlock().getDoctor().getLastName(),
                app.getBlock().getCenter().getName(),
                app.getStartTime(),
                reason
        ));
    }

    /**
     * Maps an Appointment entity to AppointmentResponse.
     *
     * doctorPublicId is resolved from the doctor profile already loaded via
     * JOIN FETCH in the repository queries — no extra SELECT is fired here.
     * For single-item lookups (findById) the profile is lazily loaded in one
     * additional query, which is acceptable for a single-row fetch.
     */
    private AppointmentResponse toResponse(Appointment a) {
        String publicId = Optional.ofNullable(a.getBlock().getDoctor().getDoctorProfile())
                .map(DoctorProfile::getPublicId)
                .orElse("no-id");

        return AppointmentResponse.builder()
                .id(a.getId())
                .blockId(a.getBlock().getId())
                .patientId(a.getPatient().getId())
                .serviceId(a.getService().getId())
                .serviceName(a.getService().getName())
                .serviceDurationMinutes(a.getService().getDurationMinutes())
                .doctorFirstName(a.getBlock().getDoctor().getFirstName())
                .doctorLastName(a.getBlock().getDoctor().getLastName())
                .doctorPublicId(publicId)
                .centerId(a.getBlock().getCenter().getId())
                .centerName(a.getBlock().getCenter().getName())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .reservedUntil(a.getReservedUntil())
                .patientNotes(a.getPatientNotes())
                .doctorNotes(a.getDoctorNotes())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
