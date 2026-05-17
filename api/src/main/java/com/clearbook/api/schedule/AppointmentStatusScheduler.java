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

    private final AppointmentRepository appointmentRepository;

    /**
     * Starts native Spring scheduler that runs every 5 minutes and checks for any SCHEDULED appointments that have already ended.
     * If it finds any, it automatically updates their status to COMPLETED.
     */
    @Scheduled(fixedRate = 300000)
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