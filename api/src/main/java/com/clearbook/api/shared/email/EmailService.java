package com.clearbook.api.shared.email;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendVerificationEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Verify your email address — ClearBook");

        String confirmationUrl = frontendUrl + "/auth/email-verification?token=" + token;

        message.setText("Hello and welcome to ClearBook!\n\n" +
                "To verify your email address and activate your account, please click the link below:\n" +
                confirmationUrl + "\n\n" +
                "This link will expire in 24 hours.");

        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Reset your password — ClearBook");

        String resetUrl = frontendUrl + "/auth/reset-password?token=" + token;

        message.setText("We have received a request to reset your password.\n\n" +
                "To set a new password, please click the link below:\n" +
                resetUrl + "\n\n" +
                "This link will expire in 1 hour. If this was not you who requested a password change, please ignore this message.");

        mailSender.send(message);
    }

    public void sendAppointmentCancelledEmail(String toEmail,
                                              String patientFirstName,
                                              String doctorFirstName,
                                              String doctorLastName,
                                              String centerName,
                                              LocalDateTime startTime,
                                              String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Your appointment has been cancelled — ClearBook");

        String formattedTime = startTime.format(
                DateTimeFormatter.ofPattern("dd.MM.yyyy 'o godz.' HH:mm"));

        StringBuilder text = new StringBuilder();
        text.append("Hello ").append(patientFirstName).append(",\n\n");
        text.append("We would like to inform you that your appointment with Dr. ")
                .append(doctorFirstName).append(" ").append(doctorLastName)
                .append(" at ").append(centerName)
                .append(", scheduled for ").append(formattedTime)
                .append(", has been cancelled by the doctor.\n\n");

        if (reason != null && !reason.isBlank()) {
            text.append("Reason for cancellation: ").append(reason).append("\n\n");
        }

        text.append("We apologize for any inconvenience. ")
                .append("You can book a new appointment on the ClearBook website:\n")
                .append(frontendUrl).append("/doctors\n\n")
                .append("The ClearBook Team");

        message.setText(text.toString());
        mailSender.send(message);
    }
}
