package com.clearbook.api.user;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.model.InviteCode;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.InviteCodeRepository;
import com.clearbook.api.user.dto.InviteCodeResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for {@link InviteCodeService}.
 *
 * Verifies the UPSERT logic in getOrCreate and the fix applied to refresh
 * (update-in-place instead of delete + insert).
 */
@DisplayName("InviteCodeService — integration tests")
class InviteCodeServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired InviteCodeService inviteCodeService;
    @Autowired InviteCodeRepository inviteCodeRepository;

    // ── getOrCreate ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getOrCreate")
    class GetOrCreate {

        @Test
        @DisplayName("should create a new code when the user has none")
        void createsNewCode() {
            User newUser = saveUser("nocode@test.com", Role.USER);

            InviteCodeResponse response = inviteCodeService.getOrCreate(newUser);

            assertThat(response.getCode()).startsWith("CB-");
            assertThat(response.getExpiresAt()).isAfter(LocalDateTime.now());
        }

        @Test
        @DisplayName("should return the same code when an unexpired one already exists")
        void returnsExistingValidCode() {
            User newUser = saveUser("existing@test.com", Role.USER);
            InviteCodeResponse first = inviteCodeService.getOrCreate(newUser);

            InviteCodeResponse second = inviteCodeService.getOrCreate(newUser);

            assertThat(second.getCode()).isEqualTo(first.getCode());
        }

        @Test
        @DisplayName("should generate a new code (updating the existing record) when the code is expired")
        void renewsExpiredCode() {
            User newUser = saveUser("expired@test.com", Role.USER);

            // Insert an already-expired record directly
            InviteCode expiredCode = inviteCodeRepository.save(InviteCode.builder()
                    .user(newUser)
                    .code("CB-EXPI-REDC")
                    .expiresAt(LocalDateTime.now().minusHours(1))
                    .build());

            InviteCodeResponse response = inviteCodeService.getOrCreate(newUser);

            // Code must have changed
            assertThat(response.getCode()).isNotEqualTo("CB-EXPI-REDC");
            // Still only ONE record in the database (UPSERT, not INSERT)
            assertThat(inviteCodeRepository.findByUser(newUser)).isPresent();
            assertThat(inviteCodeRepository.findById(expiredCode.getId())).isPresent(); // same row updated
        }
    }

    // ── refresh ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("refresh")
    class Refresh {

        @Test
        @DisplayName("should issue a different code while reusing the same database record (UPSERT fix)")
        void updatesRecordInPlace() {
            User newUser = saveUser("refresh@test.com", Role.USER);
            InviteCodeResponse original = inviteCodeService.getOrCreate(newUser);

            // Capture the database row ID before refresh
            InviteCode beforeRefresh = inviteCodeRepository.findByUser(newUser).orElseThrow();

            InviteCodeResponse refreshed = inviteCodeService.refresh(newUser);

            InviteCode afterRefresh = inviteCodeRepository.findByUser(newUser).orElseThrow();

            // The code value must be different
            assertThat(refreshed.getCode()).isNotEqualTo(original.getCode());
            // But the database row ID must be the same (update, not delete+insert)
            assertThat(afterRefresh.getId()).isEqualTo(beforeRefresh.getId());
            // New expiry must be in the future
            assertThat(refreshed.getExpiresAt()).isAfter(LocalDateTime.now());
        }

        @Test
        @DisplayName("should create a new record when the user has no existing code")
        void createsWhenNoneExists() {
            User newUser = saveUser("refresh-new@test.com", Role.USER);

            InviteCodeResponse response = inviteCodeService.refresh(newUser);

            assertThat(response.getCode()).startsWith("CB-");
            assertThat(inviteCodeRepository.findByUser(newUser)).isPresent();
        }
    }

    // ── resolveUser ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("resolveUser")
    class ResolveUser {

        @Test
        @DisplayName("should return the user for a valid, unexpired code")
        void happyPath() {
            User newUser = saveUser("resolve@test.com", Role.DOCTOR);
            InviteCodeResponse codeResp = inviteCodeService.getOrCreate(newUser);

            Optional<User> resolved = inviteCodeService.resolveUser(codeResp.getCode());

            assertThat(resolved).isPresent();
            assertThat(resolved.get().getId()).isEqualTo(newUser.getId());
        }

        @Test
        @DisplayName("should return empty Optional for an expired code")
        void expiredCode_returnsEmpty() {
            User newUser = saveUser("expired-resolve@test.com", Role.USER);
            inviteCodeRepository.save(InviteCode.builder()
                    .user(newUser)
                    .code("CB-DEAD-BEEF")
                    .expiresAt(LocalDateTime.now().minusHours(1))
                    .build());

            Optional<User> resolved = inviteCodeService.resolveUser("CB-DEAD-BEEF");

            assertThat(resolved).isEmpty();
        }

        @Test
        @DisplayName("should return empty Optional for an unknown code")
        void unknownCode_returnsEmpty() {
            Optional<User> resolved = inviteCodeService.resolveUser("CB-UNKN-OWNN");

            assertThat(resolved).isEmpty();
        }
    }
}
