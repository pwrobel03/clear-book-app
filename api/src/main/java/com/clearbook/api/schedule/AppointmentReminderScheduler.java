package com.clearbook.api.schedule;

import com.clearbook.api.notification.NotificationEvent;
import com.clearbook.api.model.Appointment;
import com.clearbook.api.model.AppointmentStatus;
import com.clearbook.api.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void processUpcomingAppointments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in35Minutes = now.plusMinutes(35);

        List<Appointment> upcomingAppointments = appointmentRepository
                .findByStatusAndStartTimeBetweenAndReminderSentFalse(
                        AppointmentStatus.SCHEDULED,
                        now,
                        in35Minutes
                );

        if (upcomingAppointments.isEmpty()) {
            return;
        }

        log.info("Found {} upcoming appointments to remind.", upcomingAppointments.size());

        for (Appointment appointment : upcomingAppointments) {
            String time = appointment.getStartTime().format(TIME_FORMAT);

            eventPublisher.publishEvent(new NotificationEvent(
                    appointment.getPatient(),
                    "⏳ Appointment in 30 minutes",
                    String.format("Reminder: your appointment with dr. %s at %s starts at %s.",
                            appointment.getBlock().getDoctor().getLastName(),
                            appointment.getBlock().getCenter().getName(),
                            time)
            ));

            eventPublisher.publishEvent(new NotificationEvent(
                    appointment.getBlock().getDoctor(),
                    "⏳ Next Patient in 30 minutes",
                    String.format("Reminder: appointment with %s %s starts at %s.",
                            appointment.getPatient().getFirstName(),
                            appointment.getPatient().getLastName(),
                            time)
            ));

            appointment.setReminderSent(true);
            appointmentRepository.save(appointment);
        }
    }
}