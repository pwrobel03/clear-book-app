package com.clearbook.api.repository;

import com.clearbook.api.model.RefreshToken;
import com.clearbook.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    /** Revokes all tokens belonging to a user — called when theft is detected. */
    @Modifying
    @Query("UPDATE RefreshToken t SET t.revoked = true WHERE t.user = :user")
    void revokeAllUserTokens(@Param("user") User user);

    /** Deletes expired tokens for a specific user (housekeeping before issuing a new one). */
    @Modifying
    @Query("DELETE FROM RefreshToken t WHERE t.user = :user AND t.expiresAt < :now")
    void deleteExpiredTokensForUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /** Global cleanup — removes all expired tokens regardless of user. */
    @Modifying
    @Query("DELETE FROM RefreshToken t WHERE t.expiresAt < :now")
    int deleteAllExpiredTokens(@Param("now") LocalDateTime now);
}
