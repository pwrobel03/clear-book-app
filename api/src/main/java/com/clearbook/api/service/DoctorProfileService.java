package com.clearbook.api.service;

import com.clearbook.api.dto.DoctorProfileRequest;
import com.clearbook.api.dto.DoctorProfileResponse;
import com.clearbook.api.model.DoctorProfile;
import com.clearbook.api.model.MembershipStatus;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.Specialization;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.repository.SpecializationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorProfileService {

    private final DoctorProfileRepository profileRepository;
    private final SpecializationRepository specializationRepository;

    /** Returns the authenticated doctor's profile. */
    public DoctorProfileResponse getMyProfile(User user) {
        assertDoctor(user);
        DoctorProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("Profile not found. Complete your profile setup first."));
        return toResponse(profile);
    }

    /** Creates or updates the profile. */
    @Transactional
    public DoctorProfileResponse createOrUpdate(User user, DoctorProfileRequest request) {
        assertDoctor(user);

        DoctorProfile profile = profileRepository.findByUser(user)
                .orElseGet(() -> DoctorProfile.builder()
                        .user(user)
                        .publicId(generatePublicId(user))
                        .build());

        // Resolve codes → entities, silently skip unknown codes
        Set<Specialization> specs = request.getSpecializations().stream()
                .map(code -> specializationRepository.findByCode(code.toUpperCase()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        profile.setSpecializations(specs);
        profile.setBio(request.getBio());
        profile.setLicenseNumber(request.getLicenseNumber());
        profile.setPublic(request.isPublic());

        return toResponse(profileRepository.save(profile));
    }

    /** Public profile by publicId (no auth required). */
    public DoctorProfileResponse getPublicProfile(String publicId) {
        DoctorProfile profile = profileRepository.findByPublicId(publicId)
                .filter(DoctorProfile::isPublic)
                .orElseThrow(() -> new IllegalArgumentException("Doctor profile not found."));
        return toResponse(profile);
    }

    /** Public search — filterable by specialization code and/or city. */
    public Page<DoctorProfileResponse> search(String specialization, String city, Pageable pageable) {
        boolean hasSpec = specialization != null && !specialization.isBlank();
        boolean hasCity = city != null && !city.isBlank();

        if (!hasSpec && !hasCity) {
            return profileRepository.findByIsPublicTrue(pageable).map(this::toResponse);
        }

        String specCode = hasSpec ? specialization.toUpperCase().trim() : null;
        String cityParam = hasCity ? city.trim() : null;

        return profileRepository
                .search(specCode, cityParam, MembershipStatus.ACTIVE, pageable)
                .map(this::toResponse);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void assertDoctor(User user) {
        if (user.getRole() != Role.DOCTOR) {
            throw new IllegalArgumentException("Only doctors can manage a doctor profile.");
        }
    }

    private String generatePublicId(User user) {
        String base = (user.getFirstName() + "-" + user.getLastName())
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        String candidate;
        do {
            String suffix = UUID.randomUUID().toString().substring(0, 4);
            candidate = base + "-" + suffix;
        } while (profileRepository.existsByPublicId(candidate));
        return candidate;
    }

    private DoctorProfileResponse toResponse(DoctorProfile p) {
        return DoctorProfileResponse.builder()
                .id(p.getId())
                .publicId(p.getPublicId())
                .firstName(p.getUser().getFirstName())
                .lastName(p.getUser().getLastName())
                .email(p.getUser().getUsername())
                // Return codes for backward compatibility; frontend resolves names via /api/specializations
                .specializations(p.getSpecializations().stream()
                        .map(Specialization::getCode)
                        .collect(Collectors.toSet()))
                .bio(p.getBio())
                .licenseNumber(p.getLicenseNumber())
                .photoUrl(p.getPhotoUrl())
                .isPublic(p.isPublic())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
