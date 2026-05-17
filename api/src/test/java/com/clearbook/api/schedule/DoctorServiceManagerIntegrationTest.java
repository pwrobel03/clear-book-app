package com.clearbook.api.schedule;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.model.*;
import com.clearbook.api.schedule.dto.CreateDoctorServiceRequest;
import com.clearbook.api.schedule.dto.DoctorServiceResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for {@link DoctorServiceManager}.
 *
 * Each test runs in a transaction that is rolled back automatically,
 * so no manual cleanup is needed between tests.
 */
@DisplayName("DoctorServiceManager — integration tests")
class DoctorServiceManagerIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private DoctorServiceManager doctorServiceManager;

    // ── createService ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createService")
    class CreateService {

        @Test
        @DisplayName("should persist a new active service with the correct attributes")
        void happyPath() {
            CreateDoctorServiceRequest request = new CreateDoctorServiceRequest();
            request.setName("Ultrasonography");
            request.setDurationMinutes(45);
            request.setPrice(new BigDecimal("200.00"));

            DoctorServiceResponse response = doctorServiceManager.createService(doctor, request);

            assertThat(response.getId()).isNotNull();
            assertThat(response.getName()).isEqualTo("Ultrasonography");
            assertThat(response.getDurationMinutes()).isEqualTo(45);
            assertThat(response.getPrice()).isEqualByComparingTo(new BigDecimal("200.00"));
            assertThat(response.isActive()).isTrue();
        }
    }

    // ── updateService ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateService")
    class UpdateService {

        @Test
        @DisplayName("should update the service in place when it has no linked appointments")
        void inPlace_whenNoAppointments() {
            // doctorService has no appointments at this point (base fixture creates none)
            CreateDoctorServiceRequest request = new CreateDoctorServiceRequest();
            request.setName("Extended Consultation");
            request.setDurationMinutes(60);
            request.setPrice(new BigDecimal("250.00"));

            DoctorServiceResponse response =
                    doctorServiceManager.updateService(doctor, doctorService.getId(), request);

            // Same UUID — the existing record was mutated, not replaced
            assertThat(response.getId()).isEqualTo(doctorService.getId());
            assertThat(response.getName()).isEqualTo("Extended Consultation");
            assertThat(response.getDurationMinutes()).isEqualTo(60);
            assertThat(response.isActive()).isTrue();
        }

        @Test
        @DisplayName("should apply Copy-on-Write when the service already has linked appointments")
        void copyOnWrite_whenAppointmentsExist() {
            // Link an appointment to doctorService to trigger the CoW path
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            saveAppointment(futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            CreateDoctorServiceRequest request = new CreateDoctorServiceRequest();
            request.setName("Extended Consultation");
            request.setDurationMinutes(60);
            request.setPrice(new BigDecimal("250.00"));

            DoctorServiceResponse response =
                    doctorServiceManager.updateService(doctor, doctorService.getId(), request);

            // A NEW record was created — ID must differ from the original
            assertThat(response.getId()).isNotEqualTo(doctorService.getId());
            assertThat(response.getName()).isEqualTo("Extended Consultation");
            assertThat(response.isActive()).isTrue();

            // The original record must now be inactive (soft-deleted by CoW)
            DoctorService original = doctorServiceRepository.findById(doctorService.getId()).orElseThrow();
            assertThat(original.isActive()).isFalse();
        }

        @Test
        @DisplayName("should throw when a different doctor tries to update the service")
        void wrongDoctor_throws() {
            User otherDoctor = saveUser("other.doctor@test.com", Role.DOCTOR);

            CreateDoctorServiceRequest request = new CreateDoctorServiceRequest();
            request.setName("Hijack");
            request.setDurationMinutes(30);
            request.setPrice(new BigDecimal("100.00"));

            assertThatThrownBy(() ->
                    doctorServiceManager.updateService(otherDoctor, doctorService.getId(), request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("permission");
        }
    }

    // ── deactivateService ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("deactivateService")
    class DeactivateService {

        @Test
        @DisplayName("should soft-delete the service (active = false)")
        void happyPath() {
            doctorServiceManager.deactivateService(doctor, doctorService.getId());

            DoctorService reloaded = doctorServiceRepository.findById(doctorService.getId()).orElseThrow();
            assertThat(reloaded.isActive()).isFalse();
        }

        @Test
        @DisplayName("should deactivate even when linked appointments exist (history preserved)")
        void withLinkedAppointments_stillDeactivates() {
            // Attach an appointment — deactivation must still succeed without exception
            LocalDateTime slotStart = futureBlock.getStartTime().plusHours(1);
            saveAppointment(futureBlock, patient, doctorService, slotStart, AppointmentStatus.SCHEDULED);

            assertThatCode(() -> doctorServiceManager.deactivateService(doctor, doctorService.getId()))
                    .doesNotThrowAnyException();

            DoctorService reloaded = doctorServiceRepository.findById(doctorService.getId()).orElseThrow();
            assertThat(reloaded.isActive()).isFalse();
        }

        @Test
        @DisplayName("should throw when a different doctor tries to deactivate the service")
        void wrongDoctor_throws() {
            User otherDoctor = saveUser("other.doctor@test.com", Role.DOCTOR);

            assertThatThrownBy(() ->
                    doctorServiceManager.deactivateService(otherDoctor, doctorService.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("permission");
        }
    }
}
