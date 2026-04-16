package com.clearbook.api.service;

import com.clearbook.api.dto.MedicalCenterResponse;
import com.clearbook.api.dto.PendingDoctorResponse;
import com.clearbook.api.exception.ConflictException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.mapper.CenterMapper;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.MedicalCenterRepository;
import com.clearbook.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.clearbook.api.dto.VerifyDoctorRequest.Action;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final MedicalCenterRepository centerRepository;
    private final CenterMapper centerMapper;

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
    public void verifyDoctor(UUID userId, Action action) {
        User doctor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (doctor.getRole() != Role.DOCTOR) {
            throw new ConflictException("User is not a doctor.");
        }

        if (action == Action.APPROVE) {
            doctor.setStatus(AccountStatus.ACTIVE);
        } else if (action == Action.REJECT) {
            doctor.setStatus(AccountStatus.BANNED);
        }

        userRepository.save(doctor);
    }

    /** Returns all medical centers awaiting platform approval. */
    public List<MedicalCenterResponse> getPendingCenters() {
        return centerRepository
                .findByStatus(CenterStatus.PENDING_APPROVAL, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .map(centerMapper::toResponse)
                .toList();
    }

    /** Approves a medical center — makes it visible in patient search. */
    @Transactional
    public MedicalCenterResponse approveCenter(UUID centerId) {
        MedicalCenter center = getCenter(centerId);
        center.setStatus(CenterStatus.ACTIVE);
        return centerMapper.toResponse(centerRepository.save(center));
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
                .orElseThrow(() -> new ResourceNotFoundException("Medical center not found."));
    }
}
