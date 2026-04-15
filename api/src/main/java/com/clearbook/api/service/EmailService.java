package com.clearbook.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendVerificationEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Potwierdzenie adresu e-mail — ClearBook");

        // Link prowadzi do naszej aplikacji we frontendzie (Next.js)
        String confirmationUrl = frontendUrl + "/auth/email-verification?token=" + token;

        message.setText("Witaj w ClearBook!\n\n" +
                "Aby potwierdzić swój adres e-mail i aktywować konto, kliknij w poniższy link:\n" +
                confirmationUrl + "\n\n" +
                "Link wygaśnie za 24 godziny.");

        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Reset your password — ClearBook");

        String resetUrl = frontendUrl + "/auth/reset-password?token=" + token;

        message.setText("Otrzymaliśmy prośbę o zresetowanie hasła.\n\n" +
                "Aby ustawić nowe hasło, kliknij w poniższy link:\n" +
                resetUrl + "\n\n" +
                "Link wygaśnie za 1 godzinę. Jeśli to nie Ty prosiłeś o zmianę, zignoruj tę wiadomość.");

        mailSender.send(message);
    }
}