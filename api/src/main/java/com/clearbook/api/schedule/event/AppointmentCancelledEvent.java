package com.clearbook.api.schedule.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;

/**
 * Fired whenever an appointment is cancelled by the doctor (block deletion,
 * schedule clear, time-bound shrink, or explicit doctor cancel).
 * The listener uses this to send a notification e-mail to the patient.
 */
@Getter
public class AppointmentCancelledEvent extends ApplicationEvent {

    private final String patientEmail;
    private final String patientFirstName;
    private final String doctorFirstName;
    private final String doctorLastName;
    private final String centerName;
    private final LocalDateTime startTime;
    /** Optional — filled in when the doctor provides an explicit reason. */
    private final String reason;

    public AppointmentCancelledEvent(Object source,
                                     String patientEmail,
                                     String patientFirstName,
                                     String doctorFirstName,
                                     String doctorLastName,
                                     String centerName,
                                     LocalDateTime startTime,
                                     String reason) {
        super(source);
        this.patientEmail = patientEmail;
        this.patientFirstName = patientFirstName;
        this.doctorFirstName = doctorFirstName;
        this.doctorLastName = doctorLastName;
        this.centerName = centerName;
        this.startTime = startTime;
        this.reason = reason;
    }
}
