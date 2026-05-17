package com.clearbook.api.schedule.event;

import com.clearbook.api.shared.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Sends a cancellation e-mail to the patient after the cancelling transaction
 * has successfully committed.
 *
 * Using @TransactionalEventListener(AFTER_COMMIT) + @Async ensures that:
 *  - the e-mail is never sent if the transaction rolls back, and
 *  - the e-mail dispatch does not block the HTTP response.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentCancelledListener {

    private final EmailService emailService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAppointmentCancelled(AppointmentCancelledEvent event) {
        try {
            emailService.sendAppointmentCancelledEmail(
                    event.getPatientEmail(),
                    event.getPatientFirstName(),
                    event.getDoctorFirstName(),
                    event.getDoctorLastName(),
                    event.getCenterName(),
                    event.getStartTime(),
                    event.getReason()
            );
        } catch (Exception e) {
            // Log but don't rethrow — a failed e-mail must never roll back the business transaction.
            log.error("Failed to send cancellation e-mail to {}: {}",
                    event.getPatientEmail(), e.getMessage(), e);
        }
    }
}
