package com.clearbook.api.auth;

import com.clearbook.api.auth.dto.*;
import com.clearbook.api.doctor.DoctorProfileService;
import com.clearbook.api.doctor.FileStorageService;
import com.clearbook.api.exception.ConflictException;
import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.exception.TokenExpiredException;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.repository.PasswordResetTokenRepository;
import com.clearbook.api.repository.UserRepository;
import com.clearbook.api.repository.VerificationTokenRepository;
import com.clearbook.api.security.JwtService;
import com.clearbook.api.shared.email.EmailService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
    private final RefreshTokenService refreshTokenService;
    private final FileStorageService fileStorageService;
    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorProfileService doctorProfileService;

    @Transactional
    public AuthResponse register(RegisterRequest request, MultipartFile file) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("There is already an account with that email address.");
        }

        if (request.getRole() == Role.ADMIN) {
            throw new ForbiddenException("Registration with admin privilege is not allowed.");
        }

        if (request.getRole() == Role.DOCTOR && (file == null || file.isEmpty())) {
            throw new IllegalArgumentException("License file is required for doctor registration.");
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

        if (request.getRole() == Role.DOCTOR) {
            String fileName = fileStorageService.storeFile(file);
            doctorProfileService.createInitialProfile(user, fileName);
        }

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

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
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

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.create(user);
        refreshTokenService.setRefreshTokenCookie(response, refreshToken.getToken());

        log.info("User {} logged in.", user.getId());
        return AuthResponse.builder()
                .token(accessToken)
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }

    /**
     * Validates the refresh token from the HttpOnly cookie, rotates it,
     * and issues a new access token.
     */
    @Transactional
    public AuthResponse refresh(String refreshTokenValue, HttpServletResponse response) {
        RefreshToken newRefreshToken = refreshTokenService.rotate(refreshTokenValue);
        refreshTokenService.setRefreshTokenCookie(response, newRefreshToken.getToken());

        String accessToken = jwtService.generateToken(newRefreshToken.getUser());
        User user = newRefreshToken.getUser();

        log.debug("Access token refreshed for user {}.", user.getId());
        return AuthResponse.builder()
                .token(accessToken)
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }

    /** Revokes the refresh token and clears the HttpOnly cookie. */
    @Transactional
    public void logout(String refreshTokenValue, HttpServletResponse response) {
        if (refreshTokenValue != null) {
            refreshTokenService.revokeByValue(refreshTokenValue);
        }
        refreshTokenService.clearRefreshTokenCookie(response);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            LocalDateTime expiryDate = LocalDateTime.now().plusHours(1);

            PasswordResetToken resetToken = passwordResetTokenRepository.findByUser(user)
                    .map(existingToken -> {
                        existingToken.setToken(token);
                        existingToken.setExpiryDate(expiryDate);
                        return existingToken;
                    })
                    .orElseGet(() -> PasswordResetToken.builder()
                            .token(token)
                            .user(user)
                            .expiryDate(expiryDate)
                            .build());

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
