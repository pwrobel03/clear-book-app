package com.clearbook.api.service;

import com.clearbook.api.dto.MedicalCenterResponse;
import com.clearbook.api.dto.PendingDoctorResponse;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.MedicalCenterRepository;
import com.clearbook.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final MedicalCenterRepository centerRepository;

    /** Returns all doctor accounts awaiting platform verification. */
    public List<PendingDoctorResponse> getPendingDoctors() {
        return userRepository.findByRoleAndStatus(Role.DOCTOR, AccountStatus.PENDING)
                .stream()
                .map(u -> PendingDoctorResponse.builder()
                        .id(u.getId())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .email(u.getUsername())
                        .createdAt(u.getCreatedAt())
                        .build())
                .toList();
    }

    /** Activates or bans a pending doctor account. */
    @Transactional
    public void verifyDoctor(UUID userId, String action) {
        User doctor = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (doctor.getRole() != Role.DOCTOR) {
            throw new IllegalArgumentException("User is not a doctor.");
        }

        switch (action.toLowerCase()) {
            case "approve" -> doctor.setStatus(AccountStatus.ACTIVE);
            case "reject"  -> doctor.setStatus(AccountStatus.BANNED);
            default -> throw new IllegalArgumentException("Unknown action: " + action);
        }

        userRepository.save(doctor);
    }

    /** Returns all medical centers awaiting platform approval. */
    public List<MedicalCenterResponse> getPendingCenters() {
        return centerRepository
                .findByStatus(CenterStatus.PENDING_APPROVAL, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(this::toCenterResponse)
                .toList();
    }

    /** Approves a medical center — makes it visible in patient search. */
    @Transactional
    public MedicalCenterResponse approveCenter(UUID centerId) {
        MedicalCenter center = getCenter(centerId);
        center.setStatus(CenterStatus.ACTIVE);
        return toCenterResponse(centerRepository.save(center));
    }

    /** Rejects / suspends a medical center. */
    @Transactional
    public void rejectCenter(UUID centerId) {
        MedicalCenter center = getCenter(centerId);
        center.setStatus(CenterStatus.SUSPENDED);
        centerRepository.save(center);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private MedicalCenter getCenter(UUID id) {
        return centerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medical center not found."));
    }

    private MedicalCenterResponse toCenterResponse(MedicalCenter c) {
        return MedicalCenterResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .address(c.getAddress())
                .city(c.getCity())
                .phone(c.getPhone())
                .email(c.getEmail())
                .website(c.getWebsite())
                .logoUrl(c.getLogoUrl())
                .type(c.getType())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
