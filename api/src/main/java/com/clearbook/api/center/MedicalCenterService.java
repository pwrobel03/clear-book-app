package com.clearbook.api.center;

import com.clearbook.api.center.dto.CenterMemberSummary;
import com.clearbook.api.center.dto.CreateCenterRequest;
import com.clearbook.api.center.dto.MedicalCenterResponse;
import com.clearbook.api.center.dto.MembershipResponse;
import com.clearbook.api.exception.ConflictException;
import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.CenterMembershipRepository;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.repository.MedicalCenterRepository;
import com.clearbook.api.schedule.AvailabilityService;
import com.clearbook.api.user.InviteCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalCenterService {

    private final MedicalCenterRepository centerRepository;
    private final CenterMembershipRepository membershipRepository;
    private final DoctorProfileRepository profileRepository;
    private final InviteCodeService inviteCodeService;
    private final CenterMapper centerMapper;
    private final AvailabilityService availabilityService;

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
        return centerMapper.toResponse(center);
    }

    /** Returns a single center by ID (accessible to anyone). */
    public MedicalCenterResponse findById(UUID id) {
        MedicalCenter center = centerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical center not found."));
        return centerMapper.toResponse(center);
    }

    /** Lists active centers, optionally filtered by city. */
    public Page<MedicalCenterResponse> findActive(String city, Pageable pageable) {
        if (city != null && !city.isBlank()) {
            return centerRepository
                    .findByStatusAndCityIgnoreCase(CenterStatus.ACTIVE, city, pageable)
                    .map(centerMapper::toResponse);
        }
        return centerRepository.findByStatus(CenterStatus.ACTIVE, pageable).map(centerMapper::toResponse);
    }

    /** Returns all memberships (INVITED + ACTIVE) for the authenticated user. */
    public List<MembershipResponse> getMyMemberships(User user) {
        return membershipRepository.findByUser(user).stream()
                .map(this::toMembershipResponse)
                .toList();
    }

    /** Returns membership details for a specific center for the authenticated user. */
    public MembershipResponse getMyMembershipInCenter(User user, UUID centerId) {
        MedicalCenter center = centerRepository.findById(centerId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical center not found."));

        CenterMembership membership = membershipRepository.findByUserAndCenter(user, center)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this center."));

        return toMembershipResponse(membership);
    }

    /**
     * Invites a user to a center using their invite code.
     * Caller must be an ADMIN member of the center.
     */
    @Transactional
    public MembershipResponse inviteByCode(User admin, UUID centerId, String rawCode, MembershipRole role) {
        MedicalCenter center = centerRepository.findById(centerId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical center not found."));

        assertCenterAdmin(admin, center);

        User target = inviteCodeService.resolveUser(rawCode)
                .orElseThrow(() -> new ResourceNotFoundException("Invite code is invalid or expired."));

        var existingMembershipOpt = membershipRepository.findByUserAndCenter(target, center);

        if (existingMembershipOpt.isPresent()) {
            CenterMembership existing = existingMembershipOpt.get();

            // Block only if user is member or have a pending request
            if (existing.getStatus() == MembershipStatus.ACTIVE || existing.getStatus() == MembershipStatus.INVITED) {
                throw new ConflictException("User is already a member or has a pending invitation.");
            }

            // Renew Invite
            existing.setRole(role);
            existing.setStatus(MembershipStatus.INVITED);
            existing.setInvitedBy(admin);
            existing.setInvitedAt(LocalDateTime.now());
            existing.setJoinedAt(null);

            return toMembershipResponse(membershipRepository.save(existing));
        }

        // First touch
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
            throw new ConflictException("Invitation is no longer pending.");
        }

        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setJoinedAt(LocalDateTime.now());
        return toMembershipResponse(membershipRepository.save(membership));
    }

    /** Rejects a pending invitation. */
    @Transactional
    public void rejectInvitation(User user, UUID membershipId) {
        CenterMembership membership = getMembershipForUser(user, membershipId);

        if (membership.getStatus() != MembershipStatus.INVITED) {
            throw new ConflictException("Invitation is no longer pending.");
        }

        membership.setStatus(MembershipStatus.REJECTED);
        membershipRepository.save(membership);
    }

    /** Updates an existing medical center. Caller must be an ADMIN of the center. */
    @Transactional
    public MedicalCenterResponse update(User admin, UUID centerId, CreateCenterRequest request) {
        MedicalCenter center = centerRepository.findById(centerId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical center not found."));

        assertCenterAdmin(admin, center);

        center.setName(request.getName());
        center.setDescription(request.getDescription());
        center.setAddress(request.getAddress());
        center.setCity(request.getCity());
        center.setPhone(request.getPhone());
        center.setEmail(request.getEmail());
        center.setWebsite(request.getWebsite());
        center.setType(request.getType());

        return centerMapper.toResponse(centerRepository.save(center));
    }

    /**
     * Returns active members of a center (publicly accessible).
     * Doctor profiles are batch-loaded in a single query to avoid N+1.
     */
    @Transactional(readOnly = true)
    public List<CenterMemberSummary> getCenterMembers(UUID centerId) {
        MedicalCenter center = centerRepository.findById(centerId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical center not found."));

        List<CenterMembership> memberships =
                membershipRepository.findByCenterAndStatus(center, MembershipStatus.ACTIVE);

        // One query for all profiles instead of one per member
        List<User> users = memberships.stream().map(CenterMembership::getUser).toList();
        Map<UUID, DoctorProfile> profileMap = profileRepository.findProfileMapByUsers(users);

        return memberships.stream()
                .map(m -> {
                    User user = m.getUser();
                    DoctorProfile profile = profileMap.get(user.getId());
                    CenterMemberSummary.CenterMemberSummaryBuilder builder = CenterMemberSummary.builder()
                            .membershipId(m.getId())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .role(m.getRole());

                    if (profile != null) {
                        builder.publicId(profile.getPublicId())
                               .specializations(profile.getSpecializations().stream()
                                       .map(Specialization::getCode)
                                       .collect(Collectors.toSet()));
                    }

                    return builder.build();
                })
                .toList();
    }

    /**
     * Removes a member from the center (soft delete by setting status to SUSPENDED).
     * Caller must be an ADMIN member of the center.
     *
     * If the removed member is a DOCTOR, all their future working blocks at this center
     * are deleted and associated appointments are automatically cancelled.
     * Past (completed) records are preserved for reporting purposes.
     */
    @Transactional
    public void removeMember(User admin, UUID centerId, UUID membershipId) {
        MedicalCenter center = centerRepository.findById(centerId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical center not found."));

        assertCenterAdmin(admin, center);

        CenterMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found."));

        if (!membership.getCenter().getId().equals(centerId)) {
            throw new ConflictException("Membership does not belong to this center.");
        }

        if (membership.getUser().getId().equals(admin.getId())) {
            throw new ConflictException("You cannot remove yourself from the center.");
        }

        // If the member is a doctor, clean up their future schedule at this center
        User removedUser = membership.getUser();
        if (removedUser.getRole() == Role.DOCTOR) {
            int cancelledAppointments = availabilityService.cancelFutureScheduleForDoctorAtCenter(removedUser, center);
            if (cancelledAppointments > 0) {
                log.info("Removed doctor {} from center {}: {} future appointments cancelled.",
                        removedUser.getId(), centerId, cancelledAppointments);
            }
        }

        membership.setStatus(MembershipStatus.SUSPENDED);
        membershipRepository.save(membership);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private CenterMembership getMembershipForUser(User user, UUID membershipId) {
        CenterMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found."));
        if (!membership.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Access denied.");
        }
        return membership;
    }

    private void assertCenterAdmin(User user, MedicalCenter center) {
        membershipRepository.findByUserAndCenter(user, center)
                .filter(m -> m.getRole() == MembershipRole.ADMIN && m.getStatus() == MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException("You are not an admin of this center."));
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
