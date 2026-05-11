package com.clearbook.api.auth;

import com.clearbook.api.auth.dto.*;
import com.clearbook.api.exception.ConflictException;
import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.exception.TokenExpiredException;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.PasswordResetTokenRepository;
import com.clearbook.api.repository.UserRepository;
import com.clearbook.api.repository.VerificationTokenRepository;
import com.clearbook.api.security.JwtService;
import com.clearbook.api.shared.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
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

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("There is already an account with that email address.");
        }

        if (request.getRole() == Role.ADMIN) {
            throw new ForbiddenException("Registration with admin privilege is not allowed.");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .status(AccountStatus.UNVERIFIED)
                .build();

        userRepository.save(user);

        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();

        tokenRepository.save(verificationToken);
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
                .orElseThrow(() -> new ResourceNotFoundException("Invalid verification token."));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new TokenExpiredException("Verification link has expired.");
        }

        User user = verificationToken.getUser();
        log.debug("Verifying email for user: {}", user.getEmail());

        if (user.getRole() == Role.DOCTOR) {
            user.setStatus(AccountStatus.PENDING);
        } else {
            user.setStatus(AccountStatus.ACTIVE);
        }

        userRepository.save(user);
        tokenRepository.delete(verificationToken);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.getStatus() == AccountStatus.UNVERIFIED) {
            throw new ForbiddenException("You must confirm your email address before logging in.");
        }

        if (user.getStatus() == AccountStatus.PENDING) {
            return AuthResponse.builder()
                    .role(user.getRole().name())
                    .status(user.getStatus().name())
                    .message("Your account is waiting for administrator approval.")
                    .build();
        }

        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Your account has been disabled.");
        }

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
                    .expiryDate(LocalDateTime.now().plusHours(1))
                    .build();

            passwordResetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), token);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ResourceNotFoundException("Password reset token not found."));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new TokenExpiredException("Password reset link has expired.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);
    }
}
