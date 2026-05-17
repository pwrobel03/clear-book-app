package com.clearbook.api.schedule;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.model.*;
import com.clearbook.api.schedule.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for {@link AppointmentService}.
 *
 * Each test runs in a transaction that is rolled back automatically,
 * so no manual cleanup is needed between tests.
 */
@DisplayName("AppointmentService — integration tests")
class AppointmentServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private AppointmentService appointmentService;

    // ── reserveSlot ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("reserveSlot")
    class ReserveSlot {

        @Test
        @DisplayName("should create a RESERVED appointment with a 15-minute hold")
        void happyPath() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            ReserveSlotRequest request = ReserveSlotRequest.builder()
                    .blockId(futureBlock.getId())
                    .serviceId(doctorService.getId())
                    .startTime(slotStart)
                    .build();

            AppointmentResponse result = appointmentService.reserveSlot(patient, request);

            assertThat(result.getId()).isNotNull();
            assertThat(result.getStatus()).isEqualTo(AppointmentStatus.RESERVED);
            assertThat(result.getReservedUntil()).isAfter(LocalDateTime.now());
            assertThat(result.getEndTime())
                    .isEqualTo(slotStart.plusMinutes(doctorService.getDurationMinutes()));
        }

        @Test
        @DisplayName("should throw when startTime is in the past")
        void pastTime_throws() {
            ReserveSlotRequest request = ReserveSlotRequest.builder()
                    .blockId(futureBlock.getId())
                    .serviceId(doctorService.getId())
                    .startTime(LocalDateTime.now().minusHours(1))
                    .build();

            assertThatThrownBy(() -> appointmentService.reserveSlot(patient, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("past");
        }

        @Test
        @DisplayName("should throw when slot starts before the block's opening time")
        void outsideBlockBounds_throws() {
            // Block starts tomorrow at 09:00 — request a slot 2 hours before it opens
            LocalDateTime beforeBlock = futureBlock.getStartTime().minusHours(2);
            ReserveSlotRequest request = ReserveSlotRequest.builder()
                    .blockId(futureBlock.getId())
                    .serviceId(doctorService.getId())
                    .startTime(beforeBlock)
                    .build();

            assertThatThrownBy(() -> appointmentService.reserveSlot(patient, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("outside");
        }

        @Test
        @DisplayName("should throw when the slot is already taken (double-booking protection)")
        void doubleBooking_throws() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            ReserveSlotRequest request = ReserveSlotRequest.builder()
                    .blockId(futureBlock.getId())
                    .serviceId(doctorService.getId())
                    .startTime(slotStart)
                    .build();

            // First reservation succeeds
            appointmentService.reserveSlot(patient, request);

            // Second patient tries the same slot
            User patient2 = saveUser("patient2@test.com", Role.USER);
            assertThatThrownBy(() -> appointmentService.reserveSlot(patient2, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("taken");
        }
    }

    // ── confirmAppointment ────────────────────────────────────────────────────

    @Nested
    @DisplayName("confirmAppointment")
    class ConfirmAppointment {

        @Test
        @DisplayName("should change status to SCHEDULED and save patient notes")
        void happyPath() {
            // Arrange: manually save a RESERVED appointment with a valid hold
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment reserved = appointmentRepository.save(Appointment.builder()
                    .block(futureBlock)
                    .patient(patient)
                    .service(doctorService)
                    .startTime(slotStart)
                    .endTime(slotStart.plusMinutes(30))
                    .status(AppointmentStatus.RESERVED)
                    .reservedUntil(LocalDateTime.now().plusMinutes(10))
                    .build());

            ConfirmAppointmentRequest request = ConfirmAppointmentRequest.builder()
                    .appointmentId(reserved.getId())
                    .patientNotes("Please bring previous test results.")
                    .build();

            AppointmentResponse result = appointmentService.confirmAppointment(patient, request);

            assertThat(result.getStatus()).isEqualTo(AppointmentStatus.SCHEDULED);
            assertThat(result.getReservedUntil()).isNull();
            assertThat(result.getPatientNotes()).isEqualTo("Please bring previous test results.");
        }

        @Test
        @DisplayName("should throw when the 15-minute hold has expired")
        void expiredReservation_throws() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment expired = appointmentRepository.save(Appointment.builder()
                    .block(futureBlock)
                    .patient(patient)
                    .service(doctorService)
                    .startTime(slotStart)
                    .endTime(slotStart.plusMinutes(30))
                    .status(AppointmentStatus.RESERVED)
                    .reservedUntil(LocalDateTime.now().minusMinutes(5)) // already expired
                    .build());

            ConfirmAppointmentRequest request = ConfirmAppointmentRequest.builder()
                    .appointmentId(expired.getId())
                    .build();

            assertThatThrownBy(() -> appointmentService.confirmAppointment(patient, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("expired");
        }

        @Test
        @DisplayName("should throw when a different patient tries to confirm")
        void wrongPatient_throws() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment reserved = appointmentRepository.save(Appointment.builder()
                    .block(futureBlock)
                    .patient(patient)
                    .service(doctorService)
                    .startTime(slotStart)
                    .endTime(slotStart.plusMinutes(30))
                    .status(AppointmentStatus.RESERVED)
                    .reservedUntil(LocalDateTime.now().plusMinutes(10))
                    .build());

            User otherPatient = saveUser("other@test.com", Role.USER);
            ConfirmAppointmentRequest request = ConfirmAppointmentRequest.builder()
                    .appointmentId(reserved.getId())
                    .build();

            assertThatThrownBy(() -> appointmentService.confirmAppointment(otherPatient, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("permission");
        }
    }

    // ── cancelAppointment (patient) ───────────────────────────────────────────

    @Nested
    @DisplayName("cancelAppointment (patient)")
    class CancelAppointmentByPatient {

        @Test
        @DisplayName("should cancel a SCHEDULED appointment")
        void happyPath() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            AppointmentResponse result =
                    appointmentService.cancelAppointment(patient, scheduled.getId());

            assertThat(result.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        }

        @Test
        @DisplayName("should throw when a different patient tries to cancel")
        void wrongPatient_throws() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            User intruder = saveUser("intruder@test.com", Role.USER);
            assertThatThrownBy(() -> appointmentService.cancelAppointment(intruder, scheduled.getId()))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("permission");
        }

        @Test
        @DisplayName("should throw when trying to cancel a COMPLETED appointment")
        void wrongStatus_throws() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment completed = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.COMPLETED);

            assertThatThrownBy(() -> appointmentService.cancelAppointment(patient, completed.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("status");
        }
    }

    // ── cancelAppointmentByDoctor ─────────────────────────────────────────────

    @Nested
    @DisplayName("cancelAppointmentByDoctor")
    class CancelAppointmentByDoctor {

        @Test
        @DisplayName("should cancel appointment and persist the cancellation reason")
        void happyPath() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            AppointmentResponse result = appointmentService.cancelAppointmentByDoctor(
                    doctor, scheduled.getId(), "Doctor unavailable due to emergency.");

            assertThat(result.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
            assertThat(result.getDoctorNotes()).isEqualTo("Doctor unavailable due to emergency.");
        }

        @Test
        @DisplayName("should throw when a different doctor tries to cancel")
        void wrongDoctor_throws() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            User otherDoctor = saveUser("other.doctor@test.com", Role.DOCTOR);
            assertThatThrownBy(() -> appointmentService.cancelAppointmentByDoctor(
                    otherDoctor, scheduled.getId(), "reason"))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("permission");
        }
    }

    // ── markAsNoShow ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("markAsNoShow")
    class MarkAsNoShow {

        @Test
        @DisplayName("should mark appointment NO_SHOW when called within the 15-minute window")
        void happyPath() {
            // Appointment that started 5 minutes ago — within the 15-min no-show window
            AvailabilityBlock ongoing = saveOngoingBlock(doctor, center);
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
            Appointment scheduled = saveAppointment(
                    ongoing, patient, doctorService, fiveMinutesAgo, AppointmentStatus.SCHEDULED);

            AppointmentResponse result = appointmentService.markAsNoShow(doctor, scheduled.getId());

            assertThat(result.getStatus()).isEqualTo(AppointmentStatus.NO_SHOW);
        }

        @Test
        @DisplayName("should throw when appointment has not started yet")
        void beforeStart_throws() {
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            assertThatThrownBy(() -> appointmentService.markAsNoShow(doctor, scheduled.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("before it starts");
        }

        @Test
        @DisplayName("should throw when the 15-minute no-show window has passed")
        void windowExpired_throws() {
            // Appointment that started 20 minutes ago — outside the 15-min window
            AvailabilityBlock ongoing = saveOngoingBlock(doctor, center);
            LocalDateTime twentyMinutesAgo = LocalDateTime.now().minusMinutes(20);
            Appointment scheduled = saveAppointment(
                    ongoing, patient, doctorService, twentyMinutesAgo, AppointmentStatus.SCHEDULED);

            assertThatThrownBy(() -> appointmentService.markAsNoShow(doctor, scheduled.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("15 minutes");
        }
    }
}
