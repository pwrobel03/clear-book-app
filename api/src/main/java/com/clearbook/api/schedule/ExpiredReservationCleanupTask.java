package com.clearbook.api.schedule;

import com.clearbook.api.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Background task that periodically cancels expired RESERVED appointments.
 *
 * When a patient reserves a time slot, it gets a 15-minute hold (reservedUntil).
 * If the patient never confirms, the reservation stays in the database as a zombie record.
 * This task cleans up those expired reservations every 5 minutes, freeing
 * the time slots for other patients.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiredReservationCleanupTask {

    private final AppointmentRepository appointmentRepository;

    @Scheduled(fixedRate = 5 * 60 * 1000) // Every 5 minutes
    @Transactional
    public void cleanupExpiredReservations() {
        int cancelled = appointmentRepository.cancelExpiredReservations();
        if (cancelled > 0) {
            log.info("Cleanup: cancelled {} expired reservations.", cancelled);
        }
    }
}
