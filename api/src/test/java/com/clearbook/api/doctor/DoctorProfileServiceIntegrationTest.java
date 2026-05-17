package com.clearbook.api.doctor;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.doctor.dto.DoctorProfileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for {@link DoctorProfileService}.
 *
 * Focuses on the access-control logic of {@code getPublicProfile(publicId, user)}
 * which was recently refactored from an N+1 loop to a single subquery.
 */
@DisplayName("DoctorProfileService — integration tests")
class DoctorProfileServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired DoctorProfileService profileService;
    @Autowired DoctorProfileRepository profileRepository;

    private DoctorProfile publicProfile;
    private DoctorProfile privateProfile;

    @BeforeEach
    void setUpProfiles() {
        publicProfile = profileRepository.save(DoctorProfile.builder()
                .user(doctor)
                .publicId("public-doc-" + doctor.getId().toString().substring(0, 4))
                .verificationStatus(VerificationStatus.VERIFIED)
                .isPublic(true)
                .averageRating(0.0)
                .totalReviews(0)
                .build());

        // A second doctor with a private profile — not public-facing yet
        User privateDoctor = saveUser("private-doc@test.com", Role.DOCTOR);
        addDoctorToCenter(privateDoctor, center);

        privateProfile = profileRepository.save(DoctorProfile.builder()
                .user(privateDoctor)
                .publicId("private-doc-" + privateDoctor.getId().toString().substring(0, 4))
                .verificationStatus(VerificationStatus.PENDING)
                .isPublic(false)
                .averageRating(0.0)
                .totalReviews(0)
                .build());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Creates an ACTIVE ADMIN membership in the given center. */
    private void makeAdminInCenter(User user, MedicalCenter c) {
        membershipRepository.save(CenterMembership.builder()
                .user(user).center(c)
                .role(MembershipRole.ADMIN).status(MembershipStatus.ACTIVE)
                .invitedBy(user).joinedAt(LocalDateTime.now())
                .build());
    }

    // ── getPublicProfile(publicId) — unauthenticated ──────────────────────────

    @Nested
    @DisplayName("getPublicProfile(publicId) — public endpoint")
    class GetPublicProfileUnauthenticated {

        @Test
        @DisplayName("should return a public profile without authentication")
        void happyPath() {
            DoctorProfileResponse response = profileService.getPublicProfile(publicProfile.getPublicId());

            assertThat(response.getPublicId()).isEqualTo(publicProfile.getPublicId());
            assertThat(response.isPublic()).isTrue();
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when profile is private")
        void privateProfile_throws() {
            assertThatThrownBy(() -> profileService.getPublicProfile(privateProfile.getPublicId()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException for an unknown publicId")
        void unknownId_throws() {
            assertThatThrownBy(() -> profileService.getPublicProfile("does-not-exist-xyz"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── getPublicProfile(publicId, user) — with requester context ─────────────

    @Nested
    @DisplayName("getPublicProfile(publicId, user) — with requester context")
    class GetPublicProfileWithRequester {

        @Test
        @DisplayName("should return a public profile for any authenticated user")
        void publicProfile_anyUser_succeeds() {
            DoctorProfileResponse response =
                    profileService.getPublicProfile(publicProfile.getPublicId(), patient);

            assertThat(response.getPublicId()).isEqualTo(publicProfile.getPublicId());
        }

        @Test
        @DisplayName("should return a private profile when requester is ADMIN in a shared center")
        void privateProfile_adminInSharedCenter_succeeds() {
            // 'patient' becomes ADMIN in the center where privateDoctor is also a member
            makeAdminInCenter(patient, center);

            DoctorProfileResponse response =
                    profileService.getPublicProfile(privateProfile.getPublicId(), patient);

            assertThat(response.getPublicId()).isEqualTo(privateProfile.getPublicId());
        }

        @Test
        @DisplayName("should throw ForbiddenException when requester is MEMBER (not ADMIN) in the shared center")
        void privateProfile_memberNotAdmin_throws() {
            // 'patient' is only a MEMBER in the center — not enough privilege
            membershipRepository.save(CenterMembership.builder()
                    .user(patient).center(center)
                    .role(MembershipRole.MEMBER).status(MembershipStatus.ACTIVE)
                    .invitedBy(doctor).joinedAt(LocalDateTime.now())
                    .build());

            assertThatThrownBy(() -> profileService.getPublicProfile(privateProfile.getPublicId(), patient))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("should throw ForbiddenException when requester shares no center with the private doctor")
        void privateProfile_noSharedCenter_throws() {
            // Create a completely separate center and make 'patient' its admin
            MedicalCenter otherCenter = saveCenter();
            makeAdminInCenter(patient, otherCenter);

            // privateDoctor is NOT a member of otherCenter → no shared center
            assertThatThrownBy(() -> profileService.getPublicProfile(privateProfile.getPublicId(), patient))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("should throw ForbiddenException when requester is null (unauthenticated) for a private profile")
        void privateProfile_nullRequester_throws() {
            assertThatThrownBy(() -> profileService.getPublicProfile(privateProfile.getPublicId(), null))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    // ── getAffiliatedCenters ──────────────────────────────────────────────────

    @Nested
    @DisplayName("getAffiliatedCenters")
    class GetAffiliatedCenters {

        @Test
        @DisplayName("should return all ACTIVE centers the doctor is an ACTIVE member of")
        void happyPath() {
            // 'doctor' is already ACTIVE in 'center' (from AbstractIntegrationTest setup)
            var centers = profileService.getAffiliatedCenters(publicProfile.getPublicId());

            assertThat(centers).hasSize(1);
            assertThat(centers.get(0).getId()).isEqualTo(center.getId());
        }

        @Test
        @DisplayName("should return empty list when doctor has no active center memberships")
        void noMemberships_returnsEmpty() {
            // privateProfile's doctor is a member but center might be active —
            // create a fresh doctor with NO center membership
            User loneDoctor = saveUser("lone-doc@test.com", Role.DOCTOR);
            DoctorProfile loneProfile = profileRepository.save(DoctorProfile.builder()
                    .user(loneDoctor)
                    .publicId("lone-doc-" + loneDoctor.getId().toString().substring(0, 4))
                    .verificationStatus(VerificationStatus.VERIFIED)
                    .isPublic(true)
                    .averageRating(0.0)
                    .totalReviews(0)
                    .build());

            var centers = profileService.getAffiliatedCenters(loneProfile.getPublicId());

            assertThat(centers).isEmpty();
        }
    }
}
