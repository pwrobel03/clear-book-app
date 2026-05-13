package com.clearbook.api.doctor;

import com.clearbook.api.center.dto.MedicalCenterResponse;
import com.clearbook.api.doctor.dto.DoctorProfileRequest;
import com.clearbook.api.doctor.dto.DoctorProfileResponse;
import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.CenterMembershipRepository;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.repository.SpecializationRepository;
import com.clearbook.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorProfileService {

    private final DoctorProfileRepository profileRepository;
    private final SpecializationRepository specializationRepository;
    private final CenterMembershipRepository centerMembershipRepository;
    private final com.clearbook.api.center.CenterMapper centerMapper;

    @Transactional
    public void createInitialProfile(User user, String licenseFilePath) {
        DoctorProfile profile = DoctorProfile.builder()
                .user(user)
                .publicId(generatePublicId(user))
                .licenseFilePath(licenseFilePath)
                .verificationStatus(VerificationStatus.PENDING)
                .isPublic(false)
                .build();

        profileRepository.save(profile);
    }

    /** Returns the authenticated doctor's profile. */
    @PreAuthorize("hasRole('DOCTOR')")
    public DoctorProfileResponse getMyProfile(User user) {
        DoctorProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found. Complete your profile setup first."));
        return toResponse(profile);
    }

    /** Creates or updates the profile. */
    @Transactional
    @PreAuthorize("hasRole('DOCTOR')")
    public DoctorProfileResponse createOrUpdate(User user, DoctorProfileRequest request) {
        DoctorProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("Critical error: Doctor profile not found despite active account."));

        Set<Specialization> specs = request.getSpecializations().stream()
                .map(code -> specializationRepository.findByCode(code.toUpperCase()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        profile.setSpecializations(specs);
        profile.setBio(request.getBio());
        profile.setLicenseNumber(request.getLicenseNumber());
        return toResponse(profileRepository.save(profile));
    }

    /** Public profile by publicId (no auth required). */
    public DoctorProfileResponse getPublicProfile(String publicId) {
        DoctorProfile profile = profileRepository.findByPublicId(publicId)
                .filter(DoctorProfile::isPublic)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        return toResponse(profile);
    }

    /** * Get profile by publicId.
     * Allows access if profile is public OR if requester is an ADMIN in any center where the doctor works.
     */
    public DoctorProfileResponse getPublicProfile(String publicId, User requester) {
        DoctorProfile profile = profileRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));

        if (profile.isPublic()) {
            return toResponse(profile);
        }

        if (requester != null) {
            boolean hasAccess = centerMembershipRepository.findByUserAndStatus(requester, MembershipStatus.ACTIVE)
                    .stream()
                    .filter(reqM -> reqM.getRole() == MembershipRole.ADMIN)
                    .anyMatch(reqM -> {
                        // Active membership
                        return centerMembershipRepository.findByUserAndCenter(profile.getUser(), reqM.getCenter())
                                .filter(docM -> docM.getStatus() == MembershipStatus.ACTIVE) // <-- KRYTYCZNY FILTR
                                .isPresent();
                    });

            if (hasAccess) {
                return toResponse(profile);
            }
        }

        throw new ForbiddenException("PRIVATE_PROFILE");
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

    /** Returns public list of active centers where the doctor works. */
    public List<MedicalCenterResponse> getAffiliatedCenters(String publicId) {
        // Find doctor profile
        DoctorProfile profile = profileRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));

        // Get association with build in JPA method
        List<CenterMembership> memberships = centerMembershipRepository
                .findByUserAndStatusAndCenter_Status(
                        profile.getUser(),
                        MembershipStatus.ACTIVE,
                        CenterStatus.ACTIVE
                );

        // Mapping
        return memberships.stream()
                .map(membership -> centerMapper.toResponse(membership.getCenter()))
                .toList();
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    public String generatePublicId(User user) {
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
                .specializations(p.getSpecializations().stream()
                        .map(Specialization::getCode)
                        .collect(Collectors.toSet()))
                .bio(p.getBio())
                .licenseNumber(p.getLicenseNumber())
                .photoUrl(p.getPhotoUrl())
                .isPublic(p.isPublic())
                .averageRating(p.getAverageRating())
                .totalReviews(p.getTotalReviews())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
