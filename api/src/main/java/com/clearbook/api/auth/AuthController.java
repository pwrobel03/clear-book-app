package com.clearbook.api.auth;

import com.clearbook.api.auth.dto.*;
import com.clearbook.api.shared.dto.MessageResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        // Jeśli brak tokenu (konto PENDING/UNVERIFIED) → 202 Accepted zamiast 200 OK
        HttpStatus status = response.getToken() == null ? HttpStatus.ACCEPTED : HttpStatus.OK;
        return ResponseEntity.status(status).body(response);
    }

    /**
     * GET /api/auth/verify-email?token=...
     * Wyjątki (ResourceNotFoundException, TokenExpiredException) propagują do GlobalExceptionHandler.
     */
    @GetMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(new MessageResponse("Email address verified successfully."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request, response);
        HttpStatus status = authResponse.getToken() == null ? HttpStatus.ACCEPTED : HttpStatus.OK;
        return ResponseEntity.status(status).body(authResponse);
    }

    /**
     * POST /api/auth/refresh
     * Reads the HttpOnly refresh-token cookie, rotates it, and returns a fresh access token.
     * No Authorization header required — the cookie carries the credentials.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder()
                            .message("Refresh token cookie is missing. Please log in again.")
                            .build());
        }
        return ResponseEntity.ok(authService.refresh(refreshToken, response));
    }

    /**
     * POST /api/auth/logout
     * Revokes the refresh token and clears the HttpOnly cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {
        authService.logout(refreshToken, response);
        return ResponseEntity.ok(new MessageResponse("Logged out successfully."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        // Zawsze zwracamy 200 OK z powodów bezpieczeństwa (nie ujawniamy czy e-mail istnieje)
        return ResponseEntity.ok(new MessageResponse("If an account is linked to this email, a reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Your password has been changed successfully."));
    }
}
