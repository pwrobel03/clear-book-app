package com.clearbook.api.schedule;

import com.clearbook.api.model.*;
import com.clearbook.api.repository.*;
import com.clearbook.api.schedule.dto.*;
import com.clearbook.api.schedule.event.AppointmentCancelledEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Manages doctor availability blocks and all operations that affect them
 * (create, update, delete, copy, clear). When blocks are removed, any
 * appointments they contain are automatically cancelled and patients are
 * notified via {@link AppointmentCancelledEvent}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilityBlockRepository blockRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalCenterRepository centerRepository;
    private final CenterMembershipRepository membershipRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ── Block CRUD ────────────────────────────────────────────────────────────

    /**
     * Creates a new working block for the doctor.
     */
    @Transactional
    public AvailabilityBlockResponse createWorkingBlock(User doctor, CreateBlockRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }
        if (!request.getStartTime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot create a working block in the past.");
        }
        if (blockRepository.existsOverlappingBlock(doctor, request.getStartTime(), request.getEndTime())) {
            throw new IllegalStateException("This working block overlaps with an existing one.");
        }

        MedicalCenter center = centerRepository.findById(request.getCenterId())
                .orElseThrow(() -> new IllegalArgumentException("Medical center not found."));

        if (!membershipRepository.existsByUserAndCenter(doctor, center)) {
            throw new IllegalStateException("You are not a member of this medical center.");
        }

        AvailabilityBlock block = AvailabilityBlock.builder()
                .doctor(doctor)
                .center(center)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        AvailabilityBlock saved = blockRepository.save(block);
        log.info("Doctor {} created a working block from {} to {}",
                doctor.getId(), request.getStartTime(), request.getEndTime());

        return toBlockResponse(saved);
    }

    /**
     * Fetches working blocks for a specific timeframe.
     */
    @Transactional(readOnly = true)
    public List<AvailabilityBlockResponse> getDoctorBlocks(User doctor, LocalDateTime start, LocalDateTime end) {
        return blockRepository.findByDoctorAndStartTimeBetweenOrderByStartTimeAsc(doctor, start, end)
                .stream()
                .map(this::toBlockResponse)
                .toList();
    }

    /**
     * Copies working blocks from a source week into one or more future weeks.
     * Blocks that would overlap with an already existing block are silently skipped.
     */
    @Transactional
    public void copyWeekSchedule(User doctor, CopyWeekRequest request) {
        LocalDateTime sourceStart = request.getSourceWeekStart();
        LocalDateTime sourceEnd = sourceStart.plusDays(7);

        List<AvailabilityBlock> sourceBlocks = blockRepository
                .findByDoctorAndStartTimeBetweenOrderByStartTimeAsc(doctor, sourceStart, sourceEnd);

        if (sourceBlocks.isEmpty()) {
            throw new IllegalArgumentException("No working blocks found in the source week to copy.");
        }

        List<AvailabilityBlock> newBlocks = new ArrayList<>();

        for (int i = 1; i <= request.getWeeksToCopy(); i++) {
            long daysToAdd = i * 7L;
            for (AvailabilityBlock original : sourceBlocks) {
                LocalDateTime newStart = original.getStartTime().plusDays(daysToAdd);
                LocalDateTime newEnd = original.getEndTime().plusDays(daysToAdd);

                if (!blockRepository.existsOverlappingBlock(doctor, newStart, newEnd)) {
                    newBlocks.add(AvailabilityBlock.builder()
                            .doctor(doctor)
                            .center(original.getCenter())
                            .startTime(newStart)
                            .endTime(newEnd)
                            .build());
                }
            }
        }

        if (!newBlocks.isEmpty()) {
            blockRepository.saveAll(newBlocks);
            log.info("Doctor {} copied {} blocks to {} future weeks.",
                    doctor.getId(), sourceBlocks.size(), request.getWeeksToCopy());
        }
    }

    /**
     * Deletes a working block. Any non-finished appointments inside the block
     * are cancelled and patients are notified by e-mail.
     */
    @Transactional
    public void deleteWorkingBlock(User doctor, UUID blockId) {
        AvailabilityBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new IllegalArgumentException("Working block not found."));

        if (!block.getDoctor().equals(doctor)) {
            throw new IllegalStateException("You do not have permission to delete this block.");
        }

        List<Appointment> appointments = appointmentRepository.findByBlock(block);
        if (!appointments.isEmpty()) {
            int cancelledCount = 0;
            for (Appointment app : appointments) {
                // Only cancel if not already cancelled or completed, to avoid duplicate events and preserve historical records
                if (app.getStatus() == AppointmentStatus.COMPLETED || app.getStatus() == AppointmentStatus.CANCELLED) {
                    continue;
                }
                app.setStatus(AppointmentStatus.CANCELLED);
                publishCancellationEvent(app, null);
                cancelledCount++;
            }

            if (cancelledCount > 0) {
                appointmentRepository.saveAll(appointments);
                log.info("Cancelled {} appointments due to block {} deletion by doctor {}",
                        cancelledCount, blockId, doctor.getId());
            }
        }

        blockRepository.delete(block);
        log.info("Working block {} deleted successfully.", blockId);
    }

    /**
     * Updates a block's time boundaries.
     * Appointments that fall outside the new window are cancelled (Safe Shrink).
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
        if (blockRepository.existsOverlappingBlockExcludingId(doctor, blockId, newStart, newEnd)) {
            throw new IllegalStateException("The updated time overlaps with another working block.");
        }

        List<Appointment> appointments = appointmentRepository.findByBlock(block);
        int cancelledCount = 0;

        for (Appointment app : appointments) {
            if (app.getStatus() == AppointmentStatus.CANCELLED
                    || app.getStatus() == AppointmentStatus.COMPLETED) {
                continue;
            }
            if (app.getStartTime().isBefore(newStart) || app.getEndTime().isAfter(newEnd)) {
                app.setStatus(AppointmentStatus.CANCELLED);
                publishCancellationEvent(app,
                        "Doctor changed the working hours, and your appointment no longer fits within the new schedule. Please book a new appointment.");
                cancelledCount++;
            }
        }

        if (cancelledCount > 0) {
            appointmentRepository.saveAll(appointments);
            log.info("Cancelled {} appointments out of bounds due to shrink on block {}", cancelledCount, blockId);
        }

        block.setStartTime(newStart);
        block.setEndTime(newEnd);
        blockRepository.save(block);
    }

    // ── Bulk operations ───────────────────────────────────────────────────────

    /**
     * Dry-run version of clearSchedule. Returns how many blocks and active appointments
     * would be affected without modifying any data.
     * Used by the frontend to show the doctor a preview before confirming.
     */
    @Transactional(readOnly = true)
    public PreviewClearScheduleResponse previewClearSchedule(User doctor, ClearScheduleRequest request) {
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

        int totalAppointments = 0;
        for (AvailabilityBlock block : blocks) {
            totalAppointments += appointmentRepository.countActiveAppointmentsByBlock(block);
        }

        return PreviewClearScheduleResponse.builder()
                .blocksAffected(blocks.size())
                .appointmentsAffected(totalAppointments)
                .build();
    }

    /**
     * Clears all working blocks within a date range, optionally scoped to one center.
     * Non-finished appointments are cancelled and patients notified.
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
            return ClearScheduleResponse.builder().blocksDeleted(0).appointmentsCancelled(0).build();
        }

        int totalCancelled = 0;
        for (AvailabilityBlock block : blocks) {
            totalCancelled += cancelFutureAppointmentsOnBlock(block, request.getReason());
        }

        blockRepository.deleteAll(blocks);
        log.info("Doctor {} cleared {} blocks ({} appointments cancelled) from {} to {}",
                doctor.getId(), blocks.size(), totalCancelled,
                request.getRangeStart(), request.getRangeEnd());

        return ClearScheduleResponse.builder()
                .blocksDeleted(blocks.size())
                .appointmentsCancelled(totalCancelled)
                .build();
    }

    /**
     * Called internally when a doctor is removed from a center.
     * Cancels all future appointments and deletes all future blocks for the doctor
     * at that specific center. Completed / historical records are preserved.
     *
     * @return number of appointments that were cancelled
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
            totalCancelled += cancelFutureAppointmentsOnBlock(block, null);
        }

        blockRepository.deleteAll(futureBlocks);
        log.info("Membership deactivation: cancelled {} appointments and removed {} future blocks "
                        + "for doctor {} at center {}",
                totalCancelled, futureBlocks.size(), doctor.getId(), center.getId());

        return totalCancelled;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Cancels all non-finished appointments on a block and notifies patients.
     * Returns the number of appointments cancelled.
     *
     * @param reason optional message forwarded to patients in the cancellation e-mail
     */
    private int cancelFutureAppointmentsOnBlock(AvailabilityBlock block, String reason) {
        List<Appointment> appointments = appointmentRepository.findByBlock(block);
        int cancelled = 0;

        for (Appointment app : appointments) {
            if (app.getStatus() != AppointmentStatus.CANCELLED
                    && app.getStatus() != AppointmentStatus.COMPLETED) {
                app.setStatus(AppointmentStatus.CANCELLED);
                publishCancellationEvent(app, reason);
                cancelled++;
            }
        }

        if (cancelled > 0) {
            appointmentRepository.saveAll(appointments);
        }

        return cancelled;
    }

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

    private AvailabilityBlockResponse toBlockResponse(AvailabilityBlock block) {
        return AvailabilityBlockResponse.builder()
                .id(block.getId())
                .centerId(block.getCenter().getId())
                .centerName(block.getCenter().getName())
                .startTime(block.getStartTime())
                .endTime(block.getEndTime())
                .appointmentCount(appointmentRepository.countActiveAppointmentsByBlock(block))
                .build();
    }
}
