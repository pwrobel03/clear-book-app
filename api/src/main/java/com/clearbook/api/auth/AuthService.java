package com.clearbook.api.auth;

import com.clearbook.api.dto.*;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.PasswordResetTokenRepository;
import com.clearbook.api.repository.UserRepository;
import com.clearbook.api.repository.VerificationTokenRepository;
import com.clearbook.api.security.JwtService;
import com.clearbook.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("The re is already an account with that email address.");
        }

        // Nie pozwalamy rejestrować kont ADMIN przez publiczny endpoint
        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Registration with admin privilege  is not allowed for this account.");
        }

        // Każde nowe konto wymaga potwierdzenia e-mail
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .status(AccountStatus.UNVERIFIED)
                .build();

        userRepository.save(user);

        // Generowanie i zapis tokenu
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();

        tokenRepository.save(verificationToken);

        // Wysyłka wiadomości
        emailService.sendVerificationEmail(user.getEmail(), token);

        return AuthResponse.builder()
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .message("Na Twój adres e-mail wysłano link weryfikacyjny. Sprawdź skrzynkę pocztową.")
                .build();
    }

    @Transactional
    public void verifyEmail(String token) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token provided."));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Verification link has expired.");
        }

        User user = verificationToken.getUser();

        System.out.printf("User: %s%n", user);

        // Zmiana statusu w zależności od roli
        if (user.getRole() == Role.DOCTOR) {
            user.setStatus(AccountStatus.PENDING); // Lekarz idzie do kolejki administratora
        } else {
            user.setStatus(AccountStatus.ACTIVE); // Pacjent staje się w pełni aktywny
        }

        userRepository.save(user);
        tokenRepository.delete(verificationToken); // Token jest jednorazowy
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Szukamy użytkownika po e-mailu
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        // Precyzyjna weryfikacja statusówpublic
        if (user.getStatus() == AccountStatus.UNVERIFIED) {
            throw new IllegalArgumentException("You have to confirm you're account before logging in.");
        }

        if (user.getStatus() == AccountStatus.PENDING) {
            // Zwracamy odpowiedź bez tokenu, frontend obsłuży status PENDING
            return AuthResponse.builder()
                    .role(user.getRole().name())
                    .status(user.getStatus().name())
                    .message("Your account is waiting for administrator approval..")
                    .build();
        }

        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Your account has been disabled or has been disabled.");
        }

        // Konto jest ACTIVE, generujemy token
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUser(user);

            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .user(user)
                    .expiryDate(LocalDateTime.now().plusHours(1)) // Ważny przez godzinę
                    .build();

            passwordResetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), token);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Wrong or expired token."));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new IllegalArgumentException("Link for password reset has been expired.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken); // Token wykorzystany, usuwamy
    }
}