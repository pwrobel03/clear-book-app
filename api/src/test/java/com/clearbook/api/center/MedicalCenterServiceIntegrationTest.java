package com.clearbook.api.center;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.exception.ConflictException;
import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.*;
import com.clearbook.api.center.dto.CenterMemberSummary;
import com.clearbook.api.center.dto.MembershipResponse;
import com.clearbook.api.user.InviteCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for {@link MedicalCenterService}.
 *
 * The base fixture (doctor, patient, center) from AbstractIntegrationTest is
 * reused. Each suite adds its own users / memberships as needed.
 */
@DisplayName("MedicalCenterService — integration tests")
class MedicalCenterServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired MedicalCenterService centerService;
    @Autowired InviteCodeService inviteCodeService;

    /** An admin user (ADMIN membership in the shared center). */
    private User admin;
    /** A doctor who will be invited / removed in tests. */
    private User invitee;

    @BeforeEach
    void setUpCenterFixtures() {
        admin   = saveUser("center-admin@test.com", Role.DOCTOR);
        invitee = saveUser("invitee@test.com", Role.DOCTOR);
        makeAdminInCenter(admin, center);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Creates an ACTIVE ADMIN membership — needed wherever assertCenterAdmin is called. */
    private void makeAdminInCenter(User user, MedicalCenter c) {
        membershipRepository.save(CenterMembership.builder()
                .user(user)
                .center(c)
                .role(MembershipRole.ADMIN)
                .status(MembershipStatus.ACTIVE)
                .invitedBy(user)
                .joinedAt(LocalDateTime.now())
                .build());
    }

    /** Creates a valid invite code for a user and returns the raw code string. */
    private String createCodeFor(User user) {
        return inviteCodeService.getOrCreate(user).getCode();
    }

    // ── inviteByCode ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("inviteByCode")
    class InviteByCode {

        @Test
        @DisplayName("should create an INVITED membership for the target user")
        void happyPath() {
            String code = createCodeFor(invitee);

            MembershipResponse response =
                    centerService.inviteByCode(admin, center.getId(), code, MembershipRole.MEMBER);

            assertThat(response.getStatus()).isEqualTo(MembershipStatus.INVITED);
            assertThat(response.getRole()).isEqualTo(MembershipRole.MEMBER);
            assertThat(response.getCenterId()).isEqualTo(center.getId());
        }

        @Test
        @DisplayName("should throw ForbiddenException when caller is not an ADMIN of the center")
        void nonAdmin_throws() {
            // 'doctor' from the base fixture is a MEMBER, not ADMIN
            String code = createCodeFor(invitee);

            assertThatThrownBy(() -> centerService.inviteByCode(doctor, center.getId(), code, MembershipRole.MEMBER))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for an invalid or unknown invite code")
        void invalidCode_throws() {
            assertThatThrownBy(() ->
                    centerService.inviteByCode(admin, center.getId(), "CB-FAKE-CODE", MembershipRole.MEMBER))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("invalid or expired");
        }

        @Test
        @DisplayName("should throw ConflictException when the user is already an ACTIVE member")
        void alreadyActiveMember_throws() {
            // Make 'invitee' an active member first
            membershipRepository.save(CenterMembership.builder()
                    .user(invitee).center(center)
                    .role(MembershipRole.MEMBER).status(MembershipStatus.ACTIVE)
                    .invitedBy(admin).joinedAt(LocalDateTime.now())
                    .build());

            String code = createCodeFor(invitee);

            assertThatThrownBy(() ->
                    centerService.inviteByCode(admin, center.getId(), code, MembershipRole.MEMBER))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("already");
        }

        @Test
        @DisplayName("should renew an invitation for a user who previously REJECTED it")
        void renewAfterRejection() {
            // Simulate a previously rejected invitation
            membershipRepository.save(CenterMembership.builder()
                    .user(invitee).center(center)
                    .role(MembershipRole.MEMBER).status(MembershipStatus.REJECTED)
                    .invitedBy(admin)
                    .build());

            String code = createCodeFor(invitee);
            MembershipResponse response =
                    centerService.inviteByCode(admin, center.getId(), code, MembershipRole.MEMBER);

            // Status must be INVITED again (not REJECTED)
            assertThat(response.getStatus()).isEqualTo(MembershipStatus.INVITED);
        }
    }

    // ── acceptInvitation / rejectInvitation ───────────────────────────────────

    @Nested
    @DisplayName("acceptInvitation & rejectInvitation")
    class InvitationResponse {

        private CenterMembership pendingMembership;

        @BeforeEach
        void createPendingInvitation() {
            pendingMembership = membershipRepository.save(CenterMembership.builder()
                    .user(invitee).center(center)
                    .role(MembershipRole.MEMBER).status(MembershipStatus.INVITED)
                    .invitedBy(admin)
                    .build());
        }

        @Test
        @DisplayName("acceptInvitation should set status to ACTIVE and record joinedAt")
        void accept_happyPath() {
            MembershipResponse response =
                    centerService.acceptInvitation(invitee, pendingMembership.getId());

            assertThat(response.getStatus()).isEqualTo(MembershipStatus.ACTIVE);
            assertThat(response.getJoinedAt()).isNotNull();
        }

        @Test
        @DisplayName("acceptInvitation should throw ForbiddenException when called by a different user")
        void accept_wrongUser_throws() {
            User outsider = saveUser("outsider@test.com", Role.USER);

            assertThatThrownBy(() -> centerService.acceptInvitation(outsider, pendingMembership.getId()))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("acceptInvitation should throw ConflictException if invitation is no longer pending")
        void accept_notPending_throws() {
            // Accept first
            centerService.acceptInvitation(invitee, pendingMembership.getId());

            // Try to accept again (now ACTIVE, not INVITED)
            assertThatThrownBy(() -> centerService.acceptInvitation(invitee, pendingMembership.getId()))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("pending");
        }

        @Test
        @DisplayName("rejectInvitation should set status to REJECTED")
        void reject_happyPath() {
            centerService.rejectInvitation(invitee, pendingMembership.getId());

            CenterMembership reloaded = membershipRepository.findById(pendingMembership.getId()).orElseThrow();
            assertThat(reloaded.getStatus()).isEqualTo(MembershipStatus.REJECTED);
        }
    }

    // ── getCenterMembers ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("getCenterMembers")
    class GetCenterMembers {

        @Test
        @DisplayName("should return only ACTIVE members of the center")
        void returnsOnlyActiveMembers() {
            // 'doctor' (MEMBER) and 'admin' (ADMIN) are both ACTIVE
            // 'invitee' has no membership yet → should not appear

            List<CenterMemberSummary> members = centerService.getCenterMembers(center.getId());

            List<String> emails = members.stream()
                    .map(m -> m.getFirstName() + " " + m.getLastName())
                    .toList();

            // doctor and admin are both active in the center
            assertThat(members).hasSizeGreaterThanOrEqualTo(2);

            // invitee has no membership — must not appear
            assertThat(emails).doesNotContain(invitee.getFirstName() + " " + invitee.getLastName());
        }
    }

    // ── removeMember ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("removeMember")
    class RemoveMember {

        @Test
        @DisplayName("should set membership status to SUSPENDED")
        void happyPath() {
            // Create active MEMBER membership for invitee
            CenterMembership membership = membershipRepository.save(CenterMembership.builder()
                    .user(invitee).center(center)
                    .role(MembershipRole.MEMBER).status(MembershipStatus.ACTIVE)
                    .invitedBy(admin).joinedAt(LocalDateTime.now())
                    .build());

            centerService.removeMember(admin, center.getId(), membership.getId());

            CenterMembership reloaded = membershipRepository.findById(membership.getId()).orElseThrow();
            assertThat(reloaded.getStatus()).isEqualTo(MembershipStatus.SUSPENDED);
        }

        @Test
        @DisplayName("should cancel future appointments when a doctor is removed")
        void doctorRemoval_cancelsFutureAppointments() {
            // Give 'invitee' (a DOCTOR) an active membership
            CenterMembership membership = membershipRepository.save(CenterMembership.builder()
                    .user(invitee).center(center)
                    .role(MembershipRole.MEMBER).status(MembershipStatus.ACTIVE)
                    .invitedBy(admin).joinedAt(LocalDateTime.now())
                    .build());

            // Create a future block and a SCHEDULED appointment for that doctor at this center
            AvailabilityBlock futureInviteeBlock = saveFutureBlock(invitee, center);
            Appointment scheduledAppt = saveAppointment(
                    futureInviteeBlock, patient, doctorService,
                    futureInviteeBlock.getStartTime().plusHours(1), AppointmentStatus.SCHEDULED);

            centerService.removeMember(admin, center.getId(), membership.getId());

            // The appointment must have been cancelled
            Appointment reloaded = appointmentRepository.findById(scheduledAppt.getId()).orElseThrow();
            assertThat(reloaded.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        }

        @Test
        @DisplayName("should throw ConflictException when admin tries to remove themselves")
        void removeSelf_throws() {
            CenterMembership adminMembership = membershipRepository
                    .findByUserAndCenter(admin, center).orElseThrow();

            assertThatThrownBy(() -> centerService.removeMember(admin, center.getId(), adminMembership.getId()))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("yourself");
        }

        @Test
        @DisplayName("should throw ForbiddenException when caller is not an ADMIN of the center")
        void nonAdmin_throws() {
            CenterMembership doctorMembership = membershipRepository
                    .findByUserAndCenter(doctor, center).orElseThrow();

            // 'patient' has no membership in this center → not an admin
            assertThatThrownBy(() -> centerService.removeMember(patient, center.getId(), doctorMembership.getId()))
                    .isInstanceOf(ForbiddenException.class);
        }
    }
}
