package com.clearbook.api.auth;

import com.clearbook.api.model.RefreshToken;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Manages the refresh-token lifecycle: creation, rotation and revocation.
 *
 * Security model:
 *  - Each refresh token is single-use (rotation).
 *  - If a revoked token is presented a second time, all sessions for that user
 *    are immediately wiped (theft detection).
 *  - Expired tokens are cleaned up every hour by a scheduled task.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token.expiration-days:7}")
    private int expirationDays;

    // ── Token operations ──────────────────────────────────────────────────────

    /** Creates a new refresh token for the user and persists it. */
    @Transactional
    public RefreshToken create(User user) {
        refreshTokenRepository.deleteExpiredTokensForUser(user, LocalDateTime.now());

        RefreshToken token = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(expirationDays))
                .build();

        return refreshTokenRepository.save(token);
    }

    /**
     * Validates the incoming token, revokes it, and issues a fresh one (rotation).
     * noRollbackFor SecurityException is used to allow detection of token reuse without losing the new token issuance.
     *
     * @throws IllegalArgumentException if the token is not found
     * @throws SecurityException        if the token was already revoked (reuse = potential theft)
     * @throws IllegalStateException    if the token has expired
     */
    @Transactional(noRollbackFor = SecurityException.class)
    public RefreshToken rotate(String tokenValue) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found."));

        if (token.isRevoked()) {
            // Reuse detected — wipe all sessions for this user immediately
            refreshTokenRepository.revokeAllUserTokens(token.getUser());
            log.warn("Refresh token reuse detected for user {}. All sessions revoked.",
                    token.getUser().getId());
            throw new SecurityException("Refresh token already used. All sessions have been revoked for your security.");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Refresh token has expired. Please log in again.");
        }

        // Revoke current token and issue a new one
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        return create(token.getUser());
    }

    /** Revokes a single token by value (called on logout). */
    @Transactional
    public void revokeByValue(String tokenValue) {
        refreshTokenRepository.findByToken(tokenValue).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            log.debug("Refresh token revoked for user {}.", token.getUser().getId());
        });
    }

    // ── Cookie helpers ────────────────────────────────────────────────────────

    /**
     * Writes a new refresh-token HttpOnly cookie to the response.
     * The cookie is scoped to /api/auth so it is only sent on auth endpoints.
     */
    public void setRefreshTokenCookie(HttpServletResponse response, String tokenValue) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", tokenValue)
                .httpOnly(true)
                .secure(false)          // set to true in production (HTTPS only)
                .path("/api/auth")
                .maxAge(Duration.ofDays(expirationDays))
                .sameSite("Lax")        // Lax allows the browser to send the cookie on
                                        // cross-origin navigations; use None+Secure in prod
                                        // if frontend and backend are on different domains
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /** Clears the refresh-token cookie (used on logout). */
    public void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // ── Scheduled cleanup ─────────────────────────────────────────────────────

    /** Removes all expired refresh tokens from the database every hour. */
    @Scheduled(fixedRate = 60 * 60 * 1000)
    @Transactional
    public void cleanupExpiredTokens() {
        int deleted = refreshTokenRepository.deleteAllExpiredTokens(LocalDateTime.now());
        if (deleted > 0) {
            log.info("Cleanup: removed {} expired refresh tokens.", deleted);
        }
    }
}
