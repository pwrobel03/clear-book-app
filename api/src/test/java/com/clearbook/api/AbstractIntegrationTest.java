package com.clearbook.api;

import com.clearbook.api.model.*;
import com.clearbook.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Base class for all integration tests.
 *
 * Spins up a real PostgreSQL instance via Testcontainers (shared across all
 * subclasses in a single JVM run).  Each test runs inside a transaction that
 * is automatically rolled back, keeping tests fully isolated from one another.
 *
 * The JavaMailSender bean is mocked so no real SMTP connection is attempted.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public abstract class AbstractIntegrationTest {

    // ── Testcontainers ────────────────────────────────────────────────────────
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void overrideDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    // ── Mocks ─────────────────────────────────────────────────────────────────

    /** Prevents real SMTP calls; EmailService still runs but send() is a no-op. */
    @MockitoBean
    protected JavaMailSender mailSender;

    // ── Repositories (for test-data setup) ───────────────────────────────────

    @Autowired protected UserRepository               userRepository;
    @Autowired protected MedicalCenterRepository      centerRepository;
    @Autowired protected CenterMembershipRepository   membershipRepository;
    @Autowired protected AvailabilityBlockRepository  blockRepository;
    @Autowired protected DoctorServiceRepository      doctorServiceRepository;
    @Autowired protected AppointmentRepository        appointmentRepository;

    // ── Shared test fixtures ──────────────────────────────────────────────────

    protected User         doctor;
    protected User         patient;
    protected MedicalCenter center;
    protected com.clearbook.api.model.DoctorService doctorService;
    protected AvailabilityBlock futureBlock;

    @BeforeEach
    void setUpBaseFixtures() {
        doctor  = saveUser("doctor@test.com",  Role.DOCTOR);
        patient = saveUser("patient@test.com", Role.USER);
        center  = saveCenter();
        addDoctorToCenter(doctor, center);
        doctorService = saveDoctorService(doctor);
        futureBlock   = saveFutureBlock(doctor, center);
    }

    // ── Factory helpers ───────────────────────────────────────────────────────

    protected User saveUser(String email, Role role) {
        return userRepository.save(User.builder()
                .email(email)
                .password("$2a$10$irrelevantHashForTests000000000000000000000000000000")
                .firstName("Test")
                .lastName(role == Role.DOCTOR ? "Doctor" : "Patient")
                .role(role)
                .status(AccountStatus.ACTIVE)
                .build());
    }

    protected MedicalCenter saveCenter() {
        return centerRepository.save(MedicalCenter.builder()
                .name("Test Clinic")
                .city("Warsaw")
                .type(CenterType.CLINIC)
                .status(CenterStatus.ACTIVE)
                .build());
    }

    protected void addDoctorToCenter(User doc, MedicalCenter c) {
        membershipRepository.save(CenterMembership.builder()
                .user(doc)
                .center(c)
                .role(MembershipRole.MEMBER)
                .status(MembershipStatus.ACTIVE)
                .invitedBy(doc)
                .joinedAt(LocalDateTime.now())
                .build());
    }

    protected com.clearbook.api.model.DoctorService saveDoctorService(User doc) {
        return doctorServiceRepository.save(
                com.clearbook.api.model.DoctorService.builder()
                        .doctor(doc)
                        .name("Consultation")
                        .durationMinutes(30)
                        .price(new BigDecimal("150.00"))
                        .active(true)
                        .build());
    }

    /**
     * Creates a block starting tomorrow at 09:00 and ending at 17:00.
     * Safe to use with service methods that reject past-time input.
     */
    protected AvailabilityBlock saveFutureBlock(User doc, MedicalCenter c) {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1)
                .withHour(9).withMinute(0).withSecond(0).withNano(0);
        return blockRepository.save(AvailabilityBlock.builder()
                .doctor(doc)
                .center(c)
                .startTime(tomorrow)
                .endTime(tomorrow.withHour(17))
                .build());
    }

    /**
     * Creates a block that started 2 hours ago and ends in 2 hours.
     * Saved directly via repository, bypassing the "future only" guard in the service.
     * Useful for no-show and similar tests that require an ongoing block.
     */
    protected AvailabilityBlock saveOngoingBlock(User doc, MedicalCenter c) {
        LocalDateTime now = LocalDateTime.now();
        return blockRepository.save(AvailabilityBlock.builder()
                .doctor(doc)
                .center(c)
                .startTime(now.minusHours(2))
                .endTime(now.plusHours(2))
                .build());
    }

    /**
     * Saves an appointment directly via repository, bypassing all service-level guards.
     * Useful for setting up pre-existing state (e.g. an already-SCHEDULED appointment).
     */
    protected Appointment saveAppointment(AvailabilityBlock block,
                                          User pat,
                                          com.clearbook.api.model.DoctorService svc,
                                          LocalDateTime start,
                                          AppointmentStatus status) {
        return appointmentRepository.save(Appointment.builder()
                .block(block)
                .patient(pat)
                .service(svc)
                .startTime(start)
                .endTime(start.plusMinutes(svc.getDurationMinutes()))
                .status(status)
                .build());
    }
}
