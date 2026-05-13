package com.clearbook.api.schedule;

import com.clearbook.api.notification.NotificationEvent;
import com.clearbook.api.model.Appointment;
import com.clearbook.api.model.AppointmentStatus;
import com.clearbook.api.repository.AppointmentRepository;
import com.clearbook.api.repository.NotificationRepository;
import com.clearbook.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final ApplicationEventPublisher eventPublisher;

    // Scheduled task that runs every 5 minutes to check for upcoming appointments and send reminders
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional // Ensure we have a transaction for the database operations
    public void processUpcomingAppointments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in35Minutes = now.plusMinutes(35);

        // We're looking for appointments that are scheduled to start between now and the next 35 minutes, and haven't had a reminder sent yet
        List<Appointment> upcomingAppointments = appointmentRepository
                .findByStatusAndStartTimeBetweenAndReminderSentFalse(
                        AppointmentStatus.SCHEDULED,
                        now,
                        in35Minutes
                );

        if (upcomingAppointments.isEmpty()) {
            return;
        }

        // log.info("Znaleziono {} wizyt do wysłania przypomnień...", upcomingAppointments.size());

        for (Appointment appointment : upcomingAppointments) {

            // Notification for Patient
            String patientMessage = String.format("Reminder: in next 30 minutes (%s) your appointment with dr. %s at center %s.",
                    appointment.getFormattedTime(),
                    appointment.getBlock().getDoctor().getLastName(),
                    appointment.getBlock().getCenter().getName());

            eventPublisher.publishEvent(new NotificationEvent(
                    appointment.getPatient(),
                    "⏳ Appointment in 30 minutes",
                    patientMessage
            ));

            // Notification for Doctor
            String doctorMessage = String.format("Reminder: in next 30 minutes (%s) you have an appointment with patient %s %s.",
                    appointment.getFormattedTime(),
                    appointment.getPatient().getFirstName(),
                    appointment.getPatient().getLastName());

            eventPublisher.publishEvent(new NotificationEvent(
                    appointment.getBlock().getDoctor(),
                    "⏳ Next Patient in 30 minutes",
                    doctorMessage
            ));

            // Marked as reminder sent to avoid duplicate notifications
            appointment.setReminderSent(true);
            appointmentRepository.save(appointment);
        }
    }
}