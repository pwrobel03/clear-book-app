package com.clearbook.api.schedule;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.model.*;
import com.clearbook.api.schedule.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for {@link AvailabilityService}.
 *
 * Each test runs in a transaction that is rolled back automatically,
 * so no manual cleanup is needed between tests.
 */
@DisplayName("AvailabilityService — integration tests")
class AvailabilityServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private AvailabilityService availabilityService;

    // ── createWorkingBlock ────────────────────────────────────────────────────

    @Nested
    @DisplayName("createWorkingBlock")
    class CreateWorkingBlock {

        @Test
        @DisplayName("should persist and return a new non-overlapping block")
        void happyPath() {
            // futureBlock occupies tomorrow 09:00–17:00; pick a non-overlapping window
            LocalDateTime start = futureBlock.getStartTime().withHour(18);
            LocalDateTime end   = start.plusHours(2);

            CreateBlockRequest request = new CreateBlockRequest();
            request.setCenterId(center.getId());
            request.setStartTime(start);
            request.setEndTime(end);

            AvailabilityBlockResponse response = availabilityService.createWorkingBlock(doctor, request);

            assertThat(response.getId()).isNotNull();
            assertThat(response.getCenterId()).isEqualTo(center.getId());
            assertThat(response.getStartTime()).isEqualTo(start);
            assertThat(response.getEndTime()).isEqualTo(end);
        }

        @Test
        @DisplayName("should throw when the new block overlaps an existing one")
        void overlap_throws() {
            // futureBlock is tomorrow 09:00–17:00; try to slide a block inside it
            LocalDateTime start = futureBlock.getStartTime().plusHours(1); // 10:00
            LocalDateTime end   = start.plusHours(2);                      // 12:00

            CreateBlockRequest request = new CreateBlockRequest();
            request.setCenterId(center.getId());
            request.setStartTime(start);
            request.setEndTime(end);

            assertThatThrownBy(() -> availabilityService.createWorkingBlock(doctor, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("overlaps");
        }

        @Test
        @DisplayName("should throw when startTime is in the past")
        void pastTime_throws() {
            // @Future bean validation is bypassed when calling the service directly
            CreateBlockRequest request = new CreateBlockRequest();
            request.setCenterId(center.getId());
            request.setStartTime(LocalDateTime.now().minusHours(2));
            request.setEndTime(LocalDateTime.now().minusHours(1));

            assertThatThrownBy(() -> availabilityService.createWorkingBlock(doctor, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("past");
        }
    }

    // ── deleteWorkingBlock ────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteWorkingBlock")
    class DeleteWorkingBlock {

        @Test
        @DisplayName("should delete the block and cancel active appointments inside it")
        void happyPath_cancelsAppointments() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            availabilityService.deleteWorkingBlock(doctor, futureBlock.getId());

            // Block must be gone
            assertThat(blockRepository.findById(futureBlock.getId())).isEmpty();

            // Appointment must be cancelled
            Appointment reloaded = appointmentRepository.findById(scheduled.getId()).orElseThrow();
            assertThat(reloaded.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        }

        @Test
        @DisplayName("should not cancel COMPLETED appointments when the block is deleted")
        void completedAppointment_notAffected() {
            // Completed appointment — already-finished records should be left alone
            AvailabilityBlock ongoing = saveOngoingBlock(doctor, center);
            LocalDateTime slotStart = ongoing.getStartTime().plusHours(1);
            Appointment completed = saveAppointment(
                    ongoing, patient, doctorService, slotStart, AppointmentStatus.COMPLETED);

            availabilityService.deleteWorkingBlock(doctor, ongoing.getId());

            Appointment reloaded = appointmentRepository.findById(completed.getId()).orElseThrow();
            assertThat(reloaded.getStatus()).isEqualTo(AppointmentStatus.COMPLETED);
        }

        @Test
        @DisplayName("should throw when a different doctor tries to delete the block")
        void wrongDoctor_throws() {
            User otherDoctor = saveUser("other.doctor@test.com", Role.DOCTOR);

            assertThatThrownBy(() -> availabilityService.deleteWorkingBlock(otherDoctor, futureBlock.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("permission");
        }
    }

    // ── updateWorkingBlockTime ────────────────────────────────────────────────

    @Nested
    @DisplayName("updateWorkingBlockTime")
    class UpdateWorkingBlockTime {

        @Test
        @DisplayName("should cancel appointments that fall outside the shrunk window (Safe Shrink)")
        void safeShrink_cancelsOutOfBoundsAppointments() {
            // futureBlock: 09:00–17:00.  Appointment at 10:00 (within original bounds).
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1); // 10:00
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            // Shrink the block so it starts at 11:00 — the 10:00 appointment is now outside
            UpdateWorkingBlockRequest request = new UpdateWorkingBlockRequest();
            request.setNewStartTime(futureBlock.getStartTime().plusHours(2)); // 11:00
            request.setNewEndTime(futureBlock.getEndTime());                  // 17:00

            availabilityService.updateWorkingBlockTime(doctor, futureBlock.getId(), request);

            Appointment reloaded = appointmentRepository.findById(scheduled.getId()).orElseThrow();
            assertThat(reloaded.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        }

        @Test
        @DisplayName("should NOT cancel appointments that still fit inside the updated window")
        void appointmentStillFits_isPreserved() {
            // Appointment at 13:00 — well inside both the old and the new window
            LocalDateTime slotStart = futureBlock.getStartTime().withHour(13);
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            // Shrink only the start from 09:00 → 11:00; 13:00 appointment is unaffected
            UpdateWorkingBlockRequest request = new UpdateWorkingBlockRequest();
            request.setNewStartTime(futureBlock.getStartTime().plusHours(2)); // 11:00
            request.setNewEndTime(futureBlock.getEndTime());                  // 17:00

            availabilityService.updateWorkingBlockTime(doctor, futureBlock.getId(), request);

            Appointment reloaded = appointmentRepository.findById(scheduled.getId()).orElseThrow();
            assertThat(reloaded.getStatus()).isEqualTo(AppointmentStatus.SCHEDULED);
        }

        @Test
        @DisplayName("should throw when the updated block would overlap another block")
        void overlap_throws() {
            // Create a second non-overlapping block: tomorrow 18:00–20:00
            LocalDateTime secondStart = futureBlock.getStartTime().withHour(18);
            AvailabilityBlock secondBlock = blockRepository.save(AvailabilityBlock.builder()
                    .doctor(doctor)
                    .center(center)
                    .startTime(secondStart)
                    .endTime(secondStart.plusHours(2))
                    .build());

            // Try to extend futureBlock past 18:00 — would collide with secondBlock
            UpdateWorkingBlockRequest request = new UpdateWorkingBlockRequest();
            request.setNewStartTime(futureBlock.getStartTime());
            request.setNewEndTime(secondBlock.getEndTime()); // 20:00 — clearly overlapping

            assertThatThrownBy(() ->
                    availabilityService.updateWorkingBlockTime(doctor, futureBlock.getId(), request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("overlaps");
        }
    }

    // ── copyWeekSchedule ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("copyWeekSchedule")
    class CopyWeekSchedule {

        @Test
        @DisplayName("should create copies of the source week's blocks one week forward")
        void happyPath() {
            // futureBlock starts tomorrow.  Use today-midnight as sourceWeekStart so it's included.
            LocalDateTime sourceWeekStart = LocalDateTime.now().toLocalDate().atStartOfDay();

            CopyWeekRequest request = new CopyWeekRequest();
            request.setSourceWeekStart(sourceWeekStart);
            request.setWeeksToCopy(1);

            availabilityService.copyWeekSchedule(doctor, request);

            LocalDateTime expectedStart = futureBlock.getStartTime().plusDays(7);
            LocalDateTime expectedEnd   = futureBlock.getEndTime().plusDays(7);

            List<AvailabilityBlockResponse> nextWeek = availabilityService.getDoctorBlocks(
                    doctor,
                    expectedStart.minusMinutes(1),
                    expectedEnd.plusMinutes(1));

            assertThat(nextWeek).hasSize(1);
            assertThat(nextWeek.get(0).getStartTime()).isEqualTo(expectedStart);
            assertThat(nextWeek.get(0).getEndTime()).isEqualTo(expectedEnd);
        }

        @Test
        @DisplayName("should throw when no blocks exist in the source week")
        void emptySourceWeek_throws() {
            // Three weeks from now — guaranteed to be empty
            LocalDateTime emptyWeekStart = LocalDateTime.now().plusWeeks(3)
                    .toLocalDate().atStartOfDay();

            CopyWeekRequest request = new CopyWeekRequest();
            request.setSourceWeekStart(emptyWeekStart);
            request.setWeeksToCopy(1);

            assertThatThrownBy(() -> availabilityService.copyWeekSchedule(doctor, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("No working blocks");
        }
    }

    // ── clearSchedule ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("clearSchedule")
    class ClearSchedule {

        @Test
        @DisplayName("should delete blocks and cancel appointments, returning correct counts")
        void happyPath() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            // Range covers the futureBlock's startTime (query uses startTime >= rangeStart)
            ClearScheduleRequest request = new ClearScheduleRequest();
            request.setRangeStart(futureBlock.getStartTime().minusMinutes(1));
            request.setRangeEnd(futureBlock.getStartTime().plusMinutes(1));

            ClearScheduleResponse response = availabilityService.clearSchedule(doctor, request);

            assertThat(response.getBlocksDeleted()).isEqualTo(1);
            assertThat(response.getAppointmentsCancelled()).isEqualTo(1);
            assertThat(blockRepository.findById(futureBlock.getId())).isEmpty();
            assertThat(appointmentRepository.findById(scheduled.getId()).orElseThrow().getStatus())
                    .isEqualTo(AppointmentStatus.CANCELLED);
        }

        @Test
        @DisplayName("should return zero counts when no blocks exist in the requested range")
        void emptyRange_returnsZero() {
            ClearScheduleRequest request = new ClearScheduleRequest();
            request.setRangeStart(LocalDateTime.now().minusYears(1));
            request.setRangeEnd(LocalDateTime.now().minusMonths(6));

            ClearScheduleResponse response = availabilityService.clearSchedule(doctor, request);

            assertThat(response.getBlocksDeleted()).isEqualTo(0);
            assertThat(response.getAppointmentsCancelled()).isEqualTo(0);
        }
    }
}
