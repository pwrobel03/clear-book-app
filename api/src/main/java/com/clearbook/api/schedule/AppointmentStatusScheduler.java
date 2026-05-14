package com.clearbook.api.schedule;

import com.clearbook.api.model.Appointment;
import com.clearbook.api.model.AppointmentStatus;
import com.clearbook.api.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentStatusScheduler {

    /** How often to check for appointments that should be auto-completed (every 5 minutes). */
    private static final long STATUS_CHECK_INTERVAL_MS = 5 * 60 * 1_000L;

    private final AppointmentRepository appointmentRepository;

    /**
     * Runs every {@value #STATUS_CHECK_INTERVAL_MS} ms and auto-completes any SCHEDULED
     * appointments whose end time has already passed.
     */
    @Scheduled(fixedRate = STATUS_CHECK_INTERVAL_MS)
    @Transactional
    public void markPastAppointmentsAsCompleted() {
        LocalDateTime now = LocalDateTime.now();

        List<Appointment> pastAppointments = appointmentRepository
                .findByStatusAndEndTimeBefore(AppointmentStatus.SCHEDULED, now);

        if (!pastAppointments.isEmpty()) {
            for (Appointment app : pastAppointments) {
                app.setStatus(AppointmentStatus.COMPLETED);
                // Optionally: ensure the block is released
                app.setReservedUntil(null);
            }
            appointmentRepository.saveAll(pastAppointments);
            log.info("CronJob: Automatically marked {} appointments as COMPLETED.", pastAppointments.size());
        }
    }
}