package com.clearbook.api.service;

import com.clearbook.api.dto.CenterMemberSummary;
import com.clearbook.api.dto.CreateCenterRequest;
import com.clearbook.api.dto.MedicalCenterResponse;
import com.clearbook.api.dto.MembershipResponse;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.CenterMembershipRepository;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.repository.MedicalCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MedicalCenterService {

    private final MedicalCenterRepository centerRepository;
    private final CenterMembershipRepository membershipRepository;
    private final DoctorProfileRepository profileRepository;
    private final InviteCodeService inviteCodeService;

    /**
     * Creates a new medical center and automatically makes the creator its ADMIN.
     * The center starts as PENDING_APPROVAL — platform admin must activate it.
     */
    @Transactional
    public MedicalCenterResponse create(User creator, CreateCenterRequest request) {
        MedicalCenter center = MedicalCenter.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .phone(request.getPhone())
                .email(request.getEmail())
                .website(request.getWebsite())
                .type(request.getType())
                .status(CenterStatus.PENDING_APPROVAL)
                .build();

        centerRepository.save(center);

        // Creator becomes ADMIN automatically (no invitation needed for the founder)
        CenterMembership adminMembership = CenterMembership.builder()
                .user(creator)
                .center(center)
                .role(MembershipRole.ADMIN)
                .status(MembershipStatus.ACTIVE)
                .invitedBy(creator)
                .joinedAt(LocalDateTime.now())
                .build();

        membershipRepository.save(adminMembership);
        return toResponse(center);
    }

    /** Returns a single center by ID (accessible to anyone). */
    public MedicalCenterResponse findById(UUID id) {
        MedicalCenter center = centerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medical center not found."));
        return toResponse(center);
    }

    /** Lists active centers, optionally filtered by city. */
    public Page<MedicalCenterResponse> findActive(String city, Pageable pageable) {
        if (city != null && !city.isBlank()) {
            return centerRepository
                    .findByStatusAndCityIgnoreCase(CenterStatus.ACTIVE, city, pageable)
                    .map(this::toResponse);
        }
        return centerRepository.findByStatus(CenterStatus.ACTIVE, pageable).map(this::toResponse);
    }

    /** Returns all memberships (INVITED + ACTIVE) for the authenticated user. */
    public List<MembershipResponse> getMyMemberships(User user) {
        return membershipRepository.findByUser(user).stream()
                .map(this::toMembershipResponse)
                .toList();
    }

    /**
     * Invites a user to a center using their invite code.
     * Caller must be an ADMIN member of the center.
     */
    @Transactional
    public MembershipResponse inviteByCode(User admin, UUID centerId, String rawCode, MembershipRole role) {
        MedicalCenter center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Medical center not found."));

        assertCenterAdmin(admin, center);

        User target = inviteCodeService.resolveUser(rawCode)
                .orElseThrow(() -> new IllegalArgumentException("Invite code is invalid or expired."));

        if (membershipRepository.existsByUserAndCenter(target, center)) {
            throw new IllegalArgumentException("User is already a member or has a pending invitation.");
        }

        CenterMembership membership = CenterMembership.builder()
                .user(target)
                .center(center)
                .role(role)
                .status(MembershipStatus.INVITED)
                .invitedBy(admin)
                .build();

        return toMembershipResponse(membershipRepository.save(membership));
    }

    /**
     * Accepts a pending invitation.
     * Only the invited user can accept their own invitation.
     */
    @Transactional
    public MembershipResponse acceptInvitation(User user, UUID membershipId) {
        CenterMembership membership = getMembershipForUser(user, membershipId);

        if (membership.getStatus() != MembershipStatus.INVITED) {
            throw new IllegalArgumentException("Invitation is no longer pending.");
        }

        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setJoinedAt(LocalDateTime.now());
        return toMembershipResponse(membershipRepository.save(membership));
    }

    /**
     * Rejects a pending invitation.
     */
    @Transactional
    public void rejectInvitation(User user, UUID membershipId) {
        CenterMembership membership = getMembershipForUser(user, membershipId);

        if (membership.getStatus() != MembershipStatus.INVITED) {
            throw new IllegalArgumentException("Invitation is no longer pending.");
        }

        membership.setStatus(MembershipStatus.REJECTED);
        membershipRepository.save(membership);
    }

    /** Returns active members of a center (publicly accessible). */
    public List<CenterMemberSummary> getCenterMembers(UUID centerId) {
        MedicalCenter center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Medical center not found."));

        return membershipRepository.findByCenterAndStatus(center, MembershipStatus.ACTIVE)
                .stream()
                .map(m -> {
                    User user = m.getUser();
                    return profileRepository.findByUser(user)
                            .map(p -> CenterMemberSummary.builder()
                                    .firstName(user.getFirstName())
                                    .lastName(user.getLastName())
                                    .publicId(p.getPublicId())
                                    .specializations(p.getSpecializations().stream()
                                            .map(com.clearbook.api.model.Specialization::getCode)
                                            .collect(java.util.stream.Collectors.toSet()))
                                    .role(m.getRole())
                                    .build())
                            .orElseGet(() -> CenterMemberSummary.builder()
                                    .firstName(user.getFirstName())
                                    .lastName(user.getLastName())
                                    .role(m.getRole())
                                    .build());
                })
                .toList();
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private CenterMembership getMembershipForUser(User user, UUID membershipId) {
        CenterMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found."));
        if (!membership.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied.");
        }
        return membership;
    }

    private void assertCenterAdmin(User user, MedicalCenter center) {
        membershipRepository.findByUserAndCenter(user, center)
                .filter(m -> m.getRole() == MembershipRole.ADMIN && m.getStatus() == MembershipStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("You are not an admin of this center."));
    }

    private MedicalCenterResponse toResponse(MedicalCenter c) {
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

    private MembershipResponse toMembershipResponse(CenterMembership m) {
        return MembershipResponse.builder()
                .id(m.getId())
                .centerId(m.getCenter().getId())
                .centerName(m.getCenter().getName())
                .centerCity(m.getCenter().getCity())
                .role(m.getRole())
                .status(m.getStatus())
                .centerStatus(m.getCenter().getStatus())
                .invitedAt(m.getInvitedAt())
                .joinedAt(m.getJoinedAt())
                .build();
    }
}
