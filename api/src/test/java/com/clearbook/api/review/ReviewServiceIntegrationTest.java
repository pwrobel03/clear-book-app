package com.clearbook.api.review;

import com.clearbook.api.AbstractIntegrationTest;
import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.AppointmentReviewRepository;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.review.dto.DoctorReplyRequest;
import com.clearbook.api.review.dto.ReviewRequest;
import com.clearbook.api.review.dto.ReviewResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.awaitility.Awaitility.await;

/**
 * Integration tests for {@link ReviewService}.
 *
 * Most tests run in a rolled-back transaction. The stats-listener suite
 * ({@link ReviewStats}) uses {@code NOT_SUPPORTED} so that AFTER_COMMIT
 * events actually fire, and cleans up after itself.
 */
@DisplayName("ReviewService — integration tests")
class ReviewServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired ReviewService reviewService;
    @Autowired AppointmentReviewRepository reviewRepository;
    @Autowired DoctorProfileRepository doctorProfileRepository;

    private Appointment completedAppointment;
    private DoctorProfile doctorProfile;

    @BeforeEach
    void setUpReviewFixtures() {
        // toResponse() reads doctor.getDoctorProfile() via the lazy reverse mapping;
        // we need the profile to exist so the join doesn't return null.
        doctorProfile = doctorProfileRepository.save(DoctorProfile.builder()
                .user(doctor)
                .publicId("dr-test-" + doctor.getId().toString().substring(0, 4))
                .verificationStatus(VerificationStatus.VERIFIED)
                .isPublic(true)
                .averageRating(0.0)
                .totalReviews(0)
                .build());

        AvailabilityBlock pastBlock = saveOngoingBlock(doctor, center);
        completedAppointment = saveAppointment(
                pastBlock, patient, doctorService,
                LocalDateTime.now().minusHours(1), AppointmentStatus.COMPLETED);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private ReviewRequest reviewRequest(int rating, String comment, boolean anonymous) {
        ReviewRequest req = new ReviewRequest();
        req.setRating(rating);
        req.setComment(comment);
        req.setAnonymous(anonymous);
        return req;
    }

    // ── createReview ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createReview")
    class CreateReview {

        @Test
        @DisplayName("should persist review for a completed appointment")
        void happyPath() {
            ReviewResponse response = reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(5, "Excellent doctor.", false));

            assertThat(response.getId()).isNotNull();
            assertThat(response.getRating()).isEqualTo(5);
            assertThat(response.getPatientComment()).isEqualTo("Excellent doctor.");
            assertThat(response.getPatientDisplayName())
                    .contains(patient.getFirstName(), patient.getLastName());
        }

        @Test
        @DisplayName("should display 'Anonymous' when the anonymous flag is set")
        void anonymous_hidesPatientName() {
            ReviewResponse response = reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(4, "Good.", true));

            assertThat(response.getPatientDisplayName()).isEqualTo("Anonymous");
        }

        @Test
        @DisplayName("should throw ForbiddenException when caller is not the appointment's patient")
        void wrongPatient_throws() {
            User stranger = saveUser("stranger@test.com", Role.USER);

            assertThatThrownBy(() -> reviewService.createReview(
                    stranger, completedAppointment.getId(),
                    reviewRequest(3, "Fine.", false)))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("should throw when appointment is not COMPLETED")
        void notCompleted_throws() {
            Appointment scheduled = saveAppointment(
                    futureBlock, patient, doctorService,
                    futureBlock.getStartTime().plusHours(1), AppointmentStatus.SCHEDULED);

            assertThatThrownBy(() -> reviewService.createReview(
                    patient, scheduled.getId(),
                    reviewRequest(3, "Too soon.", false)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("completed");
        }

        @Test
        @DisplayName("should throw when a review for this appointment already exists")
        void duplicate_throws() {
            reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(5, "Great.", false));

            assertThatThrownBy(() -> reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(5, "Second attempt.", false)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("already");
        }
    }

    // ── updateReview ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateReview")
    class UpdateReview {

        @Test
        @DisplayName("should update rating and comment in place")
        void happyPath() {
            ReviewResponse created = reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(3, "Average.", false));

            ReviewResponse updated = reviewService.updateReview(
                    patient, created.getId(),
                    reviewRequest(5, "Actually great!", false));

            assertThat(updated.getId()).isEqualTo(created.getId());
            assertThat(updated.getRating()).isEqualTo(5);
            assertThat(updated.getPatientComment()).isEqualTo("Actually great!");
        }

        @Test
        @DisplayName("should throw ForbiddenException when a different patient tries to update")
        void wrongPatient_throws() {
            ReviewResponse created = reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(3, "Average.", false));

            User intruder = saveUser("intruder@test.com", Role.USER);

            assertThatThrownBy(() -> reviewService.updateReview(
                    intruder, created.getId(),
                    reviewRequest(1, "Hijacked.", false)))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    // ── deleteReview ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteReview")
    class DeleteReview {

        @Test
        @DisplayName("should remove the review from the database")
        void happyPath() {
            ReviewResponse created = reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(4, "Good.", false));

            reviewService.deleteReview(patient, created.getId());

            assertThat(reviewRepository.existsByAppointmentId(completedAppointment.getId())).isFalse();
        }

        @Test
        @DisplayName("should throw ForbiddenException when a different patient tries to delete")
        void wrongPatient_throws() {
            ReviewResponse created = reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(4, "Good.", false));

            User intruder = saveUser("intruder@test.com", Role.USER);

            assertThatThrownBy(() -> reviewService.deleteReview(intruder, created.getId()))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    // ── replyToReview / deleteReply ───────────────────────────────────────────

    @Nested
    @DisplayName("replyToReview & deleteReply")
    class DoctorReply {

        @Test
        @DisplayName("should save the doctor's reply and set repliedAt")
        void reply_happyPath() {
            ReviewResponse created = reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(4, "Good.", false));

            DoctorReplyRequest replyReq = new DoctorReplyRequest();
            replyReq.setReply("Thank you for your feedback!");

            ReviewResponse withReply = reviewService.replyToReview(doctor, created.getId(), replyReq);

            assertThat(withReply.getDoctorReply()).isEqualTo("Thank you for your feedback!");
            assertThat(withReply.getRepliedAt()).isNotNull();
        }

        @Test
        @DisplayName("should throw ForbiddenException when a different doctor tries to reply")
        void reply_wrongDoctor_throws() {
            ReviewResponse created = reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(4, "Good.", false));

            User otherDoctor = saveUser("other.doc@test.com", Role.DOCTOR);
            DoctorReplyRequest replyReq = new DoctorReplyRequest();
            replyReq.setReply("Intruder reply.");

            assertThatThrownBy(() -> reviewService.replyToReview(otherDoctor, created.getId(), replyReq))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("deleteReply should clear the reply and repliedAt fields")
        void deleteReply_clearsReply() {
            ReviewResponse created = reviewService.createReview(
                    patient, completedAppointment.getId(),
                    reviewRequest(4, "Good.", false));

            DoctorReplyRequest replyReq = new DoctorReplyRequest();
            replyReq.setReply("Thank you!");
            reviewService.replyToReview(doctor, created.getId(), replyReq);

            ReviewResponse afterDelete = reviewService.deleteReply(doctor, created.getId());

            assertThat(afterDelete.getDoctorReply()).isNull();
            assertThat(afterDelete.getRepliedAt()).isNull();
        }
    }

    // ── getReviewsByDoctorPublicId ─────────────────────────────────────────────

    @Nested
    @DisplayName("getReviewsByDoctorPublicId")
    class GetReviewsByPublicId {

        @Test
        @DisplayName("should return all reviews for a doctor, paginated, newest first")
        void happyPath() {
            // Second completed appointment for the same doctor
            AvailabilityBlock block2 = saveOngoingBlock(doctor, center);
            Appointment completed2 = saveAppointment(
                    block2, patient, doctorService,
                    LocalDateTime.now().minusHours(2), AppointmentStatus.COMPLETED);

            reviewService.createReview(patient, completedAppointment.getId(), reviewRequest(5, "Excellent.", false));
            reviewService.createReview(patient, completed2.getId(), reviewRequest(4, "Good.", false));

            Page<ReviewResponse> page = reviewService.getReviewsByDoctorPublicId(
                    doctorProfile.getPublicId(), PageRequest.of(0, 10));

            assertThat(page.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("should return empty page when the doctor has no reviews")
        void noReviews_returnsEmpty() {
            Page<ReviewResponse> page = reviewService.getReviewsByDoctorPublicId(
                    doctorProfile.getPublicId(), PageRequest.of(0, 10));

            assertThat(page.getTotalElements()).isZero();
        }
    }

    // ── ReviewStatsListener (async, AFTER_COMMIT) ─────────────────────────────

    /**
     * The stats listener fires after transaction commit and runs asynchronously.
     * This suite is non-transactional so commits actually happen, and uses
     * Awaitility to wait for the async update to settle.
     */
    @Nested
    @DisplayName("ReviewStatsListener — async stats update")
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    class ReviewStats {

        @org.junit.jupiter.api.AfterEach
        void cleanUp() {
            // Manual cleanup because @Transactional rollback is disabled for this suite
            reviewRepository.deleteAll();
            appointmentRepository.deleteAll();
            blockRepository.deleteAll();
            doctorServiceRepository.deleteAll();
            membershipRepository.deleteAll();
            doctorProfileRepository.deleteAll();
            centerRepository.deleteAll();
            userRepository.deleteAll();
        }

        @Test
        @DisplayName("should update doctor's averageRating and totalReviews after a review is created")
        void statsAreUpdatedAfterReview() {
            // Re-create fixtures (no @Transactional means @BeforeEach data was rolled back)
            User doc  = saveUser("stats-doc@test.com",  Role.DOCTOR);
            User pat  = saveUser("stats-pat@test.com",  Role.USER);
            MedicalCenter c = saveCenter();
            addDoctorToCenter(doc, c);
            com.clearbook.api.model.DoctorService svc = saveDoctorService(doc);
            AvailabilityBlock block = saveOngoingBlock(doc, c);

            DoctorProfile profile = doctorProfileRepository.save(DoctorProfile.builder()
                    .user(doc)
                    .publicId("stats-doc-" + doc.getId().toString().substring(0, 4))
                    .verificationStatus(VerificationStatus.VERIFIED)
                    .isPublic(true)
                    .averageRating(0.0)
                    .totalReviews(0)
                    .build());

            Appointment appt = saveAppointment(block, pat, svc,
                    LocalDateTime.now().minusHours(1), AppointmentStatus.COMPLETED);

            ReviewRequest req = new ReviewRequest();
            req.setRating(4);
            req.setComment("Very good.");
            req.setAnonymous(false);
            reviewService.createReview(pat, appt.getId(), req);

            // Listener is @Async — wait up to 3 seconds for the profile to be updated
            await().atMost(3, TimeUnit.SECONDS).untilAsserted(() -> {
                DoctorProfile refreshed = doctorProfileRepository.findById(profile.getId()).orElseThrow();
                assertThat(refreshed.getTotalReviews()).isEqualTo(1);
                assertThat(refreshed.getAverageRating()).isEqualTo(4.0);
            });
        }
    }
}
