package com.clearbook.api.service;

import com.clearbook.api.dto.InviteCodeResponse;
import com.clearbook.api.model.InviteCode;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.InviteCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InviteCodeService {

    /**
     * Crockford-safe alphabet: digits 2–9 + uppercase letters
     */
    private static final String ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
    private static final int SEGMENT_LENGTH = 4;
    private static final int TTL_HOURS = 72;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final InviteCodeRepository inviteCodeRepository;

    /**
     * Returns the user's current invite code if still valid,
     * otherwise generates a new one automatically.
     */
    @Transactional
    public InviteCodeResponse getOrCreate(User user) {
        return inviteCodeRepository.findByUser(user)
                .filter(ic -> !ic.isExpired())
                .map(this::toResponse)
                .orElseGet(() -> create(user));
    }

    /**
     * The old code is immediately invalidated.
     */
    @Transactional
    public InviteCodeResponse refresh(User user) {
        inviteCodeRepository.deleteByUser(user);
        return create(user);
    }

    /**
     * Looks up a user by invite code.
     */
    public java.util.Optional<User> resolveUser(String rawCode) {
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
