package com.clearbook.api.service;

import com.clearbook.api.dto.DoctorProfileRequest;
import com.clearbook.api.dto.DoctorProfileResponse;
import com.clearbook.api.model.DoctorProfile;
import com.clearbook.api.model.Role;
import com.clearbook.api.model.User;
import com.clearbook.api.repository.DoctorProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DoctorProfileService {

    private final DoctorProfileRepository profileRepository;

    /**
     * Returns the authenticated doctor's profile, or throws if they don't have one yet.
     */
    public DoctorProfileResponse getMyProfile(User user) {
        assertDoctor(user);
        DoctorProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("Profile not found. Complete your profile setup first."));
        return toResponse(profile);
    }

    /**
     * Creates the profile on first call, updates it on subsequent calls.
     */
    @Transactional
    public DoctorProfileResponse createOrUpdate(User user, DoctorProfileRequest request) {
        assertDoctor(user);

        DoctorProfile profile = profileRepository.findByUser(user)
                .orElseGet(() -> DoctorProfile.builder()
                        .user(user)
                        .publicId(generatePublicId(user))
                        .build());

        profile.setSpecializations(request.getSpecializations());
        profile.setBio(request.getBio());
        profile.setLicenseNumber(request.getLicenseNumber());
        profile.setPublic(request.isPublic());

        return toResponse(profileRepository.save(profile));
    }

    /**
     * Returns a public-facing profile by publicId (accessible without authentication).
     */
    public DoctorProfileResponse getPublicProfile(String publicId) {
        DoctorProfile profile = profileRepository.findByPublicId(publicId)
                .filter(DoctorProfile::isPublic)
                .orElseThrow(() -> new IllegalArgumentException("Doctor profile not found."));
        return toResponse(profile);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void assertDoctor(User user) {
        if (user.getRole() != Role.DOCTOR) {
            throw new IllegalArgumentException("Only doctors can manage a doctor profile.");
        }
    }

    /** Generates a URL-safe publicId, e.g. "anna-nowak-a3f2". Retries on collision. */
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
                .specializations(p.getSpecializations())
                .bio(p.getBio())
                .licenseNumber(p.getLicenseNumber())
                .photoUrl(p.getPhotoUrl())
                .isPublic(p.isPublic())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
