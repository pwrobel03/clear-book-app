package com.clearbook.api.schedule;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.User;
import com.clearbook.api.schedule.dto.ReserveSlotRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Concurrency test for appointment booking with pessimistic locking")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class AppointmentConcurrencyIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @AfterEach
    void cleanUp() {
        // Cascade truncate - delete all data from users and medical_centers (or any related tables) to ensure clean state for each test
        jdbcTemplate.execute("TRUNCATE TABLE users, medical_centers CASCADE");
    }

    @Test
    @DisplayName("Should allow only one reservation under concurrent access by 10 patients (Pessimistic Lock)")
    void shouldPreventDoubleBookingUnderConcurrentLoad() throws InterruptedException {
        // Arrange - prepare test data: medical center, doctor, service, future block
        int threadCount = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        LocalDateTime slotStart = futureBlock.getStartTime().plusHours(2);

        ReserveSlotRequest request = ReserveSlotRequest.builder()
                .blockId(futureBlock.getId())
                .serviceId(doctorService.getId())
                .startTime(slotStart)
                .build();

        // 10 patient with unique emails trying to book the same slot concurrently
        List<User> concurrentPatients = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            concurrentPatients.add(saveUser("patient_concurrent_" + i + "@test.com", Role.USER));
        }

        // Every patient tries to reserve the same slot at the same time
        List<Callable<Boolean>> tasks = new ArrayList<>();
        for (User currentPatient : concurrentPatients) {
            tasks.add(() -> {
                try {
                    appointmentService.reserveSlot(currentPatient, request);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            });
        }

        // Act - run all tasks concurrently and wait for results
        List<Future<Boolean>> results = executorService.invokeAll(tasks);

        // Assert - count how many reservations succeeded and how many failed due to pessimistic locking
        int successfulReservations = 0;
        int failedReservations = 0;

        for (Future<Boolean> result : results) {
            try {
                if (Boolean.TRUE.equals(result.get())) {
                    successfulReservations++;
                } else {
                    failedReservations++;
                }
            } catch (ExecutionException e) {
                failedReservations++;
            }
        }

        // Business rule: only one reservation should succeed, the rest should fail due to pessimistic locking
        assertThat(successfulReservations).isEqualTo(1);
        assertThat(failedReservations).isEqualTo(threadCount - 1);
    }
}