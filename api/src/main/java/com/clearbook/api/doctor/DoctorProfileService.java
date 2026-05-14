package com.clearbook.api.doctor;

import com.clearbook.api.center.CenterMapper;
import com.clearbook.api.center.dto.MedicalCenterResponse;
import com.clearbook.api.doctor.dto.DoctorProfileRequest;
import com.clearbook.api.doctor.dto.DoctorProfileResponse;
import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.CenterMembership;
import com.clearbook.api.model.CenterStatus;
import com.clearbook.api.model.DoctorProfile;
import com.clearbook.api.model.MembershipStatus;
import com.clearbook.api.model.Specialization;
import com.clearbook.api.model.User;
import com.clearbook.api.model.VerificationStatus;
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
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorProfileService {

    private final DoctorProfileRepository profileRepository;
    private final SpecializationRepository specializationRepository;
    private final CenterMembershipRepository centerMembershipRepository;
    private final CenterMapper centerMapper;

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
    @Transactional(readOnly = true)
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
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        profile.setSpecializations(specs);
        profile.setBio(request.getBio());
        profile.setLicenseNumber(request.getLicenseNumber());
        return toResponse(profileRepository.save(profile));
    }

    /** Public profile by publicId (no auth required). */
    @Transactional(readOnly = true)
    public DoctorProfileResponse getPublicProfile(String publicId) {
        DoctorProfile profile = profileRepository.findByPublicId(publicId)
                .filter(DoctorProfile::isPublic)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));
        return toResponse(profile);
    }

    /**
     * Returns a doctor profile by publicId.
     * Accessible if the profile is public, OR if the requester is an ACTIVE ADMIN
     * in at least one center where the doctor is also an ACTIVE member.
     */
    @Transactional(readOnly = true)
    public DoctorProfileResponse getPublicProfile(String publicId, User requester) {
        DoctorProfile profile = profileRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found."));

        if (profile.isPublic()) {
            return toResponse(profile);
        }

        if (requester != null) {
            boolean hasAccess = centerMembershipRepository
                    .existsSharedActiveCenterWhereRequesterIsAdmin(profile.getUser(), requester);

            if (hasAccess) {
                return toResponse(profile);
            }
        }

        throw new ForbiddenException("PRIVATE_PROFILE");
    }

    /** Public search — filterable by specialization code and/or city. */
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
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
