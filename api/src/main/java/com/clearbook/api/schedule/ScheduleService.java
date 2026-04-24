package com.clearbook.api.schedule;

import com.clearbook.api.model.*;
import com.clearbook.api.repository.*;
import com.clearbook.api.schedule.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final AvailabilityBlockRepository blockRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorServiceRepository doctorServiceRepository;
    private final MedicalCenterRepository centerRepository;
    private final CenterMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    /**
     * DOCTOR LOGIC: Creates a new working block for the doctor.
     */
    @Transactional
    public AvailabilityBlockResponse createWorkingBlock(User doctor, CreateBlockRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        if (blockRepository.existsOverlappingBlock(doctor, request.getStartTime(), request.getEndTime())) {
            throw new IllegalStateException("This working block overlaps with an existing one.");
        }

        MedicalCenter center = centerRepository.findById(request.getCenterId())
                .orElseThrow(() -> new IllegalArgumentException("Medical center not found"));

        // Verify the doctor is an active member of this center
        if (!membershipRepository.existsByUserAndCenter(doctor, center)) {
            throw new IllegalStateException("You are not a member of this medical center.");
        }

        AvailabilityBlock block = AvailabilityBlock.builder()
                .doctor(doctor)
                .center(center)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        log.info("Doctor {} created a working block from {} to {}", doctor.getId(), request.getStartTime(), request.getEndTime());
        AvailabilityBlock saved = blockRepository.save(block);

        return AvailabilityBlockResponse.builder()
                .id(saved.getId())
                .centerId(saved.getCenter().getId())
                .centerName(saved.getCenter().getName())
                .startTime(saved.getStartTime())
                .endTime(saved.getEndTime())
                .build();
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
     * DOCTOR LOGIC: Copies the working blocks from a specific week to future weeks.
     */
    @Transactional
    public void copyWeekSchedule(User doctor, CopyWeekRequest request) {
        LocalDateTime sourceStart = request.getSourceWeekStart();
        LocalDateTime sourceEnd = sourceStart.plusDays(7);

        // Download all blocks from the base week
        List<AvailabilityBlock> sourceBlocks = blockRepository.findByDoctorAndStartTimeBetweenOrderByStartTimeAsc(
                doctor, sourceStart, sourceEnd);

        if (sourceBlocks.isEmpty()) {
            throw new IllegalArgumentException("No working blocks found in the source week to copy.");
        }

        List<AvailabilityBlock> newBlocks = new ArrayList<>();

        // Create duplicates for each subsequent week
        for (int i = 1; i <= request.getWeeksToCopy(); i++) {
            long daysToAdd = i * 7L;

            for (AvailabilityBlock originalBlock : sourceBlocks) {
                LocalDateTime newStartTime = originalBlock.getStartTime().plusDays(daysToAdd);
                LocalDateTime newEndTime = originalBlock.getEndTime().plusDays(daysToAdd);

                // Check if there is no block already in this new time (to avoid duplicates/conflicts)
                boolean isOverlapping = blockRepository.existsOverlappingBlock(doctor, newStartTime, newEndTime);

                if (!isOverlapping) {
                    AvailabilityBlock clonedBlock = AvailabilityBlock.builder()
                            .doctor(doctor)
                            .center(originalBlock.getCenter())
                            .startTime(newStartTime)
                            .endTime(newEndTime)
                            .build();
                    newBlocks.add(clonedBlock);
                }
            }
        }

        // We save all generated blocks at once (Batch Insert)
        if (!newBlocks.isEmpty()) {
            blockRepository.saveAll(newBlocks);
            log.info("Doctor {} copied {} blocks to {} future weeks.", doctor.getId(), sourceBlocks.size(), request.getWeeksToCopy());
        }
    }

    /**
     * DOCTOR LOGIC: Deletes a working block.
     * If there are any appointments scheduled within this block, they are automatically cancelled.
     */
    @Transactional
    public void deleteWorkingBlock(User doctor, UUID blockId) {
        AvailabilityBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new IllegalArgumentException("Working block not found."));

        // Security: only the owner of the block can delete it
        if (!block.getDoctor().equals(doctor)) {
            throw new IllegalStateException("You do not have permission to delete this block.");
        }

        // Find every visit
        List<Appointment> appointments = appointmentRepository.findByBlock(block);

        // If there are visits change their status
        if (!appointments.isEmpty()) {
            for (Appointment app : appointments) {
                app.setStatus(AppointmentStatus.CANCELLED);
                // Here, in the future, we can add the throwing of an asynchronous Event (ApplicationEventPublisher),
                // which will send emails to patients informing them of their appointment cancellations.
            }
            appointmentRepository.saveAll(appointments);
            log.info("Cancelled {} appointments due to block {} deletion by doctor {}",
                    appointments.size(), blockId, doctor.getId());
        }

        // Delete the job block itself
        blockRepository.delete(block);
        log.info("Working block {} deleted successfully.", blockId);
    }

    /**
     * DOCTOR LOGIC: Updates a working block's time bounds.
     * Safely cancels ONLY the appointments that fall completely or partially outside the new time window.
     */
    @Transactional
    public void updateWorkingBlockTime(User doctor, UUID blockId, UpdateWorkingBlockRequest request) {
        AvailabilityBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new IllegalArgumentException("Working block not found."));

        if (!block.getDoctor().equals(doctor)) {
            throw new IllegalStateException("You do not have permission to edit this block.");
        }

        LocalDateTime newStart = request.getNewStartTime();
        LocalDateTime newEnd = request.getNewEndTime();

        if (!newStart.isBefore(newEnd)) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        // Check if the updated time overlaps with ANOTHER block for this doctor
        boolean isOverlapping = blockRepository.existsOverlappingBlockExcludingId(doctor, blockId, newStart, newEnd);
        if (isOverlapping) {
            throw new IllegalStateException("The updated time overlaps with another working block.");
        }

        // --- SAFE SHRINK LOGIC ---
        List<Appointment> appointments = appointmentRepository.findByBlock(block);
        int cancelledCount = 0;

        for (Appointment app : appointments) {
            // Skip appointments that are already cancelled or completed
            if (app.getStatus() == AppointmentStatus.CANCELLED || app.getStatus() == AppointmentStatus.COMPLETED) {
                continue;
            }

            // Cancel the appointment if it falls outside the new time boundaries
            if (app.getStartTime().isBefore(newStart) || app.getEndTime().isAfter(newEnd)) {
                app.setStatus(AppointmentStatus.CANCELLED);
                cancelledCount++;
            }
        }

        if (cancelledCount > 0) {
            appointmentRepository.saveAll(appointments);
            log.info("Cancelled {} appointments out of bounds due to shrink on block {}", cancelledCount, blockId);
        }

        // Update the block's time boundaries
        block.setStartTime(newStart);
        block.setEndTime(newEnd);
        blockRepository.save(block);
    }

    /**
     * PATIENT LOGIC STEP 1: Locks the specific time frame for 15 minutes.
     * Uses PESSIMISTIC LOCKING on the entire block to prevent Race Conditions.
     */
    @Transactional
    public AppointmentResponse reserveSlot(User patient, ReserveSlotRequest request) {

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
        return toResponse(appointmentRepository.save(appointment));
    }

    /**
     * PATIENT LOGIC STEP 2: Confirms the appointment after filling out the form.
     * Only appointments with RESERVED status can be confirmed.
     */
    @Transactional
    public AppointmentResponse confirmAppointment(User patient, ConfirmAppointmentRequest request) {

        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found."));

        // Validate ownership
        if (!appointment.getPatient().equals(patient)) {
            throw new IllegalStateException("You do not have permission to confirm this appointment.");
        }

        // Only RESERVED appointments can be confirmed
        if (appointment.getStatus() != AppointmentStatus.RESERVED) {
            throw new IllegalStateException("This appointment cannot be confirmed (current status: " + appointment.getStatus() + ").");
        }

        // Check if the hold has expired
        if (appointment.getReservedUntil() != null &&
                appointment.getReservedUntil().isBefore(LocalDateTime.now())) {
            appointment.setStatus(AppointmentStatus.CANCELLED);
            appointmentRepository.save(appointment);
            throw new IllegalStateException("Your reservation time has expired. Please select the time slot again.");
        }

        // Confirm
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setReservedUntil(null); // Clear the timer
        appointment.setPatientNotes(request.getPatientNotes());

        log.info("Patient {} confirmed appointment {}.", patient.getId(), appointment.getId());
        return toResponse(appointmentRepository.save(appointment));
    }

    /**
     * DOCTOR LOGIC: Clears all working blocks (and their appointments) within a date range.
     * Optionally scoped to a specific medical center.
     * Only future, non-completed appointments are cancelled — historical records are preserved.
     */
    @Transactional
    public ClearScheduleResponse clearSchedule(User doctor, ClearScheduleRequest request) {
        if (!request.getRangeStart().isBefore(request.getRangeEnd())) {
            throw new IllegalArgumentException("Range start must be before range end.");
        }

        MedicalCenter center = null;
        if (request.getCenterId() != null) {
            center = centerRepository.findById(request.getCenterId())
                    .orElseThrow(() -> new IllegalArgumentException("Medical center not found."));
        }

        List<AvailabilityBlock> blocks = blockRepository.findBlocksInRange(
                doctor, request.getRangeStart(), request.getRangeEnd(), center);

        if (blocks.isEmpty()) {
            return ClearScheduleResponse.builder()
                    .blocksDeleted(0)
                    .appointmentsCancelled(0)
                    .build();
        }

        int totalCancelled = 0;

        for (AvailabilityBlock block : blocks) {
            totalCancelled += cancelFutureAppointmentsOnBlock(block);
        }

        blockRepository.deleteAll(blocks);

        log.info("Doctor {} cleared {} blocks ({} appointments cancelled) from {} to {}",
                doctor.getId(), blocks.size(), totalCancelled, request.getRangeStart(), request.getRangeEnd());

        return ClearScheduleResponse.builder()
                .blocksDeleted(blocks.size())
                .appointmentsCancelled(totalCancelled)
                .build();
    }

    /**
     * INTERNAL: Called when a doctor's membership in a center is deactivated (suspended/removed).
     * Cancels all future appointments and removes all future availability blocks
     * for this doctor at this specific center. Past records are preserved for reporting.
     *
     * @return the number of appointments that were cancelled
     */
    @Transactional
    public int cancelFutureScheduleForDoctorAtCenter(User doctor, MedicalCenter center) {
        List<AvailabilityBlock> futureBlocks = blockRepository.findFutureBlocksByDoctorAndCenter(
                doctor, center, LocalDateTime.now());

        if (futureBlocks.isEmpty()) {
            return 0;
        }

        int totalCancelled = 0;

        for (AvailabilityBlock block : futureBlocks) {
            totalCancelled += cancelFutureAppointmentsOnBlock(block);
        }

        blockRepository.deleteAll(futureBlocks);

        log.info("Membership deactivation: cancelled {} appointments and removed {} future blocks " +
                        "for doctor {} at center {}",
                totalCancelled, futureBlocks.size(), doctor.getId(), center.getId());

        return totalCancelled;
    }

    /**
     * Cancels all non-completed, non-cancelled appointments on a given block.
     * Returns the count of cancelled appointments.
     */
    private int cancelFutureAppointmentsOnBlock(AvailabilityBlock block) {
        List<Appointment> appointments = appointmentRepository.findByBlock(block);
        int cancelled = 0;

        for (Appointment app : appointments) {
            if (app.getStatus() != AppointmentStatus.CANCELLED &&
                    app.getStatus() != AppointmentStatus.COMPLETED) {
                app.setStatus(AppointmentStatus.CANCELLED);
                cancelled++;
            }
        }

        if (cancelled > 0) {
            appointmentRepository.saveAll(appointments);
        }

        return cancelled;
    }

    // ── PUBLIC ENDPOINTS (no auth required) ──

    /**
     * PUBLIC: Returns all available time slots for a given doctor and service.
     *
     * Algorithm:
     * 1. Fetch all future AvailabilityBlocks for the doctor.
     * 2. For each block, fetch existing appointments (the "occupied" ranges).
     * 3. Walk through the block in increments of serviceDuration, checking each
     *    potential slot against the occupied ranges.
     * 4. Return only the slots that fit without overlapping any existing appointment.
     *
     * This is a read-only operation — no locking needed.
     * The actual race condition protection happens at reservation time (pessimistic lock).
     */
    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlots(UUID doctorId, UUID serviceId,
                                                          LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        DoctorService service = doctorServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found."));

        if (!service.isActive() || !service.getDoctor().getId().equals(doctorId)) {
            throw new IllegalArgumentException("Invalid service for this doctor.");
        }

        int duration = service.getDurationMinutes();
        List<AvailabilityBlock> futureBlocks = blockRepository.findFutureBlocksByDoctorId(
                doctorId, LocalDateTime.now(), rangeStart, rangeEnd);

        List<AvailableSlotResponse> slots = new ArrayList<>();

        for (AvailabilityBlock block : futureBlocks) {
            List<Appointment> occupied = appointmentRepository.findActiveAppointmentsByBlock(block);

            LocalDateTime cursor = block.getStartTime();

            // If the block has already started, snap cursor to next clean interval
            if (cursor.isBefore(LocalDateTime.now())) {
                cursor = LocalDateTime.now().plusMinutes(1);
                // Round up to next 5-minute mark for clean UX
                int minute = cursor.getMinute();
                int roundedUp = ((minute / 5) + 1) * 5;
                cursor = cursor.withMinute(0).withSecond(0).withNano(0).plusMinutes(roundedUp);
            }

            while (!cursor.plusMinutes(duration).isAfter(block.getEndTime())) {
                LocalDateTime slotEnd = cursor.plusMinutes(duration);

                // Check if this candidate slot overlaps with any occupied appointment
                boolean isOccupied = false;
                for (Appointment app : occupied) {
                    // Expired RESERVED appointments don't count as occupied
                    if (app.getStatus() == AppointmentStatus.RESERVED &&
                            app.getReservedUntil() != null &&
                            app.getReservedUntil().isBefore(LocalDateTime.now())) {
                        continue;
                    }

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

    /**
     * PUBLIC: Returns all active services offered by a specific doctor.
     */
    @Transactional(readOnly = true)
    public List<DoctorServiceResponse> getDoctorServices(UUID doctorId) {
        User doctor = findDoctorById(doctorId);
        return doctorServiceRepository.findAllByDoctorAndActiveTrue(doctor).stream()
                .map(s -> DoctorServiceResponse.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .durationMinutes(s.getDurationMinutes())
                        .price(s.getPrice())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorServiceResponse> getMyServices(User doctor) {
        return doctorServiceRepository.findByDoctor(doctor).stream()
                .map(s -> DoctorServiceResponse.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .durationMinutes(s.getDurationMinutes())
                        .price(s.getPrice())
                        .active(s.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorServiceResponse createDoctorService(User doctor, CreateDoctorServiceRequest request) {
        DoctorService service = DoctorService.builder()
                .doctor(doctor)
                .name(request.getName())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .active(true) // Nowa usługa jest domyślnie aktywna
                .build();

        service = doctorServiceRepository.save(service);

        return DoctorServiceResponse.builder()
                .id(service.getId())
                .name(service.getName())
                .durationMinutes(service.getDurationMinutes())
                .price(service.getPrice())
                .active(service.isActive())
                .build();
    }

    @Transactional
    public DoctorServiceResponse updateDoctorService(User doctor, UUID serviceId, CreateDoctorServiceRequest request) {
        DoctorService service = doctorServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found."));

        if (!service.getDoctor().equals(doctor)) {
            throw new IllegalStateException("You do not have permission to edit this service.");
        }

        // Aktualizujemy dane
        service.setName(request.getName());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setPrice(request.getPrice());

        // Zapisujemy zmiany
        service = doctorServiceRepository.save(service);

        return DoctorServiceResponse.builder()
                .id(service.getId())
                .name(service.getName())
                .durationMinutes(service.getDurationMinutes())
                .price(service.getPrice())
                .active(service.isActive())
                .build();
    }

    @Transactional
    public void deactivateDoctorService(User doctor, UUID serviceId) {
        DoctorService service = doctorServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found."));

        if (!service.getDoctor().equals(doctor)) {
            throw new IllegalStateException("You do not have permission to deactivate this service.");
        }

        if (appointmentRepository.existsByService(service)) {
            throw new IllegalStateException("Cannot deactivate a service that has booked appointments.");
        }

        // Zamiast usuwać z bazy, zmieniamy status (Soft Delete)
        service.setActive(false);
        doctorServiceRepository.save(service);
    }

    // ── PATIENT ENDPOINTS ──

    /**
     * PATIENT: Returns paginated list of the patient's appointments.
     * Optionally filtered by status (SCHEDULED, COMPLETED, CANCELLED, etc.)
     */
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getPatientAppointments(User patient, AppointmentStatus status, Pageable pageable) {
        return appointmentRepository.findByPatient(patient, status, pageable)
                .map(this::toResponse);
    }

    /**
     * PATIENT: Cancels a scheduled appointment.
     * Only the owning patient can cancel, and only if the appointment is SCHEDULED or RESERVED.
     */
    @Transactional
    public AppointmentResponse cancelAppointment(User patient, UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found."));

        if (!appointment.getPatient().equals(patient)) {
            throw new IllegalStateException("You do not have permission to cancel this appointment.");
        }

        if (appointment.getStatus() != AppointmentStatus.SCHEDULED &&
                appointment.getStatus() != AppointmentStatus.RESERVED) {
            throw new IllegalStateException(
                    "Cannot cancel appointment with status: " + appointment.getStatus() + ".");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setReservedUntil(null);

        log.info("Patient {} cancelled appointment {}.", patient.getId(), appointmentId);
        return toResponse(appointmentRepository.save(appointment));
    }

    // ── DOCTOR ENDPOINTS ──

    /**
     * DOCTOR: Returns paginated list of the doctor's appointments (across all blocks).
     * Optionally filtered by status.
     */
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getDoctorAppointments(User doctor, AppointmentStatus status, Pageable pageable) {
        return appointmentRepository.findByDoctor(doctor, status, pageable)
                .map(this::toResponse);
    }

    // ── Private helpers ──

    private User findDoctorById(UUID doctorId) {
        return userRepository.findById(doctorId)
                .filter(u -> u.getRole() == Role.DOCTOR)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found."));
    }

    // ── Mapping helpers ──

    private DoctorServiceResponse toServiceResponse(DoctorService s) {
        return DoctorServiceResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .durationMinutes(s.getDurationMinutes())
                .price(s.getPrice())
                .build();
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .blockId(a.getBlock().getId())
                .patientId(a.getPatient().getId())
                .serviceId(a.getService().getId())
                .serviceName(a.getService().getName())
                .serviceDurationMinutes(a.getService().getDurationMinutes())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .reservedUntil(a.getReservedUntil())
                .patientNotes(a.getPatientNotes())
                .createdAt(a.getCreatedAt())
                .build();
    }
}