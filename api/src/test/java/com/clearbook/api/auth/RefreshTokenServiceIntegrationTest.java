package com.clearbook.api.auth;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.model.RefreshToken;
import com.clearbook.api.repository.RefreshTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("RefreshTokenService Integration Tests")
class RefreshTokenServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Test
    @DisplayName("Should create a refresh token and rotate it successfully, revoking the old token")
    void shouldCreateAndRotateToken() {
        // Create a refresh token for the patient
        RefreshToken initialToken = refreshTokenService.create(patient);
        assertThat(initialToken.getToken()).isNotNull();
        assertThat(initialToken.isRevoked()).isFalse();

        // Rotation: the old token should be revoked and a new token should be issued
        RefreshToken newToken = refreshTokenService.rotate(initialToken.getToken());

        // Tokens cannot be the same due to rotation, and the new token must be active (not revoked)
        assertThat(newToken.getToken()).isNotEqualTo(initialToken.getToken());
        assertThat(newToken.isRevoked()).isFalse();

        // The old token should now be revoked in the database
        RefreshToken oldTokenInDb = refreshTokenRepository.findById(initialToken.getId()).orElseThrow();
        assertThat(oldTokenInDb.isRevoked()).isTrue();
    }

    @Test
    @DisplayName("Critical: Should detect token reuse (theft) and revoke all tokens for the user")
    void shouldDetectTheftAndWipeAllSessions() {
        // Login and get a refresh token for the patient
        RefreshToken token1 = refreshTokenService.create(patient);

        // User renew token
        RefreshToken token2 = refreshTokenService.rotate(token1.getToken());

        // Validation: token2 is active and valid
        assertThat(refreshTokenRepository.findByToken(token2.getToken()).get().isRevoked()).isFalse();

        // Attack: attempt to reuse the old token1 (which should now be revoked)
        assertThatThrownBy(() -> refreshTokenService.rotate(token1.getToken()))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("already used"); // Nasz wyjątek z systemu

        // After the attack, we need to flush and clear the persistence context to ensure we read the latest state from the database
        entityManager.flush();
        entityManager.clear();

        // Protected: After detecting the reuse of token1, ALL tokens for this user must be revoked immediately
        RefreshToken compromisedToken2 = refreshTokenRepository.findByToken(token2.getToken()).orElseThrow();
        assertThat(compromisedToken2.isRevoked()).isTrue();
    }

    @Test
    @DisplayName("Should reject expired refresh token and not allow rotation")
    void shouldRejectExpiredToken() {
        // Manualy create an expired token for the patient
        RefreshToken expiredToken = RefreshToken.builder()
                .user(patient)
                .token("expired-token-123")
                .expiresAt(LocalDateTime.now().minusDays(1))
                .revoked(false)
                .build();
        refreshTokenRepository.save(expiredToken);

        // Attempt to rotate the expired token, expecting an IllegalStateException due to expiration
        assertThatThrownBy(() -> refreshTokenService.rotate("expired-token-123"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("expired");
    }
}