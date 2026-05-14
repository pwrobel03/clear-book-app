package com.clearbook.api.user;

import com.clearbook.api.model.InviteCode;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.InviteCodeRepository;
import com.clearbook.api.user.dto.InviteCodeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InviteCodeService {

    /** Crockford-safe alphabet: digits 2–9 + uppercase letters (no 0/O, 1/I/L, U) */
    private static final String ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
    private static final int SEGMENT_LENGTH = 4;
    private static final int TTL_HOURS = 72;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final InviteCodeRepository inviteCodeRepository;

    /**
     * Fetches the valid invite code for the user, or creates/updates one if it's missing or expired.
     * Uses the UPSERT pattern to prevent Hibernate's INSERT-before-DELETE constraint violations.
     */
    @Transactional
    public InviteCodeResponse getOrCreate(User user) {
        // Check if the user already has any code in the database
        InviteCode inviteCode = inviteCodeRepository.findByUser(user).orElse(null);

        if (inviteCode != null) {
            // If it exists and is still valid, just return it
            if (inviteCode.getExpiresAt().isAfter(LocalDateTime.now())) {
                return toResponse(inviteCode);
            }

            // If it exists but is expired, UPDATE the existing record instead of deleting it
            inviteCode.setCode(generateUniqueCode());
            inviteCode.setExpiresAt(LocalDateTime.now().plusHours(TTL_HOURS));
            inviteCodeRepository.save(inviteCode);

            return toResponse(inviteCode);
        }

        // If no record exists at all, create a brand new one
        InviteCode newCode = InviteCode.builder()
                .user(user)
                .code(generateUniqueCode())
                .expiresAt(LocalDateTime.now().plusHours(TTL_HOURS))
                .build();

        inviteCodeRepository.save(newCode);
        return toResponse(newCode);
    }

    /**
     * Invalidates the current code and issues a fresh one.
     * Updates the existing record in place (same UPSERT pattern as getOrCreate) to
     * avoid DELETE + INSERT, which could violate constraints under concurrent requests.
     */
    @Transactional
    public InviteCodeResponse refresh(User user) {
        InviteCode existing = inviteCodeRepository.findByUser(user).orElse(null);

        if (existing != null) {
            existing.setCode(generateUniqueCode());
            existing.setExpiresAt(LocalDateTime.now().plusHours(TTL_HOURS));
            return toResponse(inviteCodeRepository.save(existing));
        }

        return create(user);
    }

    /** Looks up a user by invite code — returns empty if code is missing or expired. */
    public Optional<User> resolveUser(String rawCode) {
        return inviteCodeRepository.findByCode(rawCode.toUpperCase())
                .filter(ic -> !ic.isExpired())
                .map(InviteCode::getUser);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private InviteCodeResponse create(User user) {
        String code = generateUniqueCode();
        InviteCode inviteCode = InviteCode.builder()
                .code(code)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(TTL_HOURS))
                .build();
        inviteCodeRepository.save(inviteCode);
        return toResponse(inviteCode);
    }

    /** Generates a code and retries on the extremely unlikely collision. */
    private String generateUniqueCode() {
        String code;
        do {
            code = generateCode();
        } while (inviteCodeRepository.existsByCode(code));
        return code;
    }

    /** Produces a code in the format CB-XXXX-XXXX. */
    private String generateCode() {
        return "CB-" + randomSegment() + "-" + randomSegment();
    }

    private String randomSegment() {
        StringBuilder sb = new StringBuilder(SEGMENT_LENGTH);
        for (int i = 0; i < SEGMENT_LENGTH; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    private InviteCodeResponse toResponse(InviteCode ic) {
        return InviteCodeResponse.builder()
                .code(ic.getCode())
                .expiresAt(ic.getExpiresAt())
                .build();
    }
}
