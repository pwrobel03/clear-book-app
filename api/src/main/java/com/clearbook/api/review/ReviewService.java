package com.clearbook.api.review;

import com.clearbook.api.exception.ForbiddenException;
import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.AppointmentRepository;
import com.clearbook.api.repository.AppointmentReviewRepository;
import com.clearbook.api.repository.DoctorProfileRepository;
import com.clearbook.api.review.dto.DoctorReplyRequest;
import com.clearbook.api.review.dto.ReviewRequest;
import com.clearbook.api.review.dto.ReviewResponse;
import com.clearbook.api.review.event.ReviewChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final AppointmentReviewRepository reviewRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ReviewResponse createReview(User patient, UUID appointmentId, ReviewRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found."));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("You can only rate your own appointment.");
        }

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("You can only leave a review after a completed appointment.");
        }

        if (reviewRepository.existsByAppointmentId(appointmentId)) {
            throw new IllegalStateException("A review for this appointment has already been submitted.");
        }

        AppointmentReview review = AppointmentReview.builder()
                .appointment(appointment)
                .rating(request.getRating())
                .patientComment(request.getComment())
                .isAnonymous(request.isAnonymous())
                .build();

        review = reviewRepository.save(review);
        eventPublisher.publishEvent(new ReviewChangedEvent(this, appointment.getBlock().getDoctor().getId()));

        return toResponse(review, false);
    }

    @Transactional
    public ReviewResponse updateReview(User patient, UUID reviewId, ReviewRequest request) {
        AppointmentReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found."));

        if (!review.getAppointment().getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("You do not have permission to update this review.");
        }

        review.setRating(request.getRating());
        review.setPatientComment(request.getComment());
        review.setAnonymous(request.isAnonymous());

        eventPublisher.publishEvent(new ReviewChangedEvent(this, review.getAppointment().getBlock().getDoctor().getId()));

        return toResponse(reviewRepository.save(review), false);
    }

    @Transactional
    public void deleteReview(User patient, UUID reviewId) {
        AppointmentReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found."));

        if (!review.getAppointment().getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("You do not have permission to delete this review.");
        }

        reviewRepository.delete(review);
        eventPublisher.publishEvent(new ReviewChangedEvent(this, review.getAppointment().getBlock().getDoctor().getId()));
    }

    @Transactional
    public ReviewResponse replyToReview(User doctor, UUID reviewId, DoctorReplyRequest request) {
        AppointmentReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found."));

        if (!review.getAppointment().getBlock().getDoctor().getId().equals(doctor.getId())) {
            throw new ForbiddenException("You can only respond to reviews for your own appointments.");
        }

        review.setDoctorReply(request.getReply());
        review.setRepliedAt(LocalDateTime.now());

        // forceShowPatient=true so the doctor always sees the patient's name regardless of anonymity setting
        return toResponse(reviewRepository.save(review), true);
    }

    @Transactional
    public ReviewResponse deleteReply(User doctor, UUID reviewId) {
        AppointmentReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found."));

        if (!review.getAppointment().getBlock().getDoctor().getId().equals(doctor.getId())) {
            throw new ForbiddenException("You can only delete replies to your own reviews.");
        }

        review.setDoctorReply(null);
        review.setRepliedAt(null);

        return toResponse(reviewRepository.save(review), true);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getReviewByAppointmentId(User user, UUID appointmentId) {
        AppointmentReview review = reviewRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found."));

        boolean isPatient = review.getAppointment().getPatient().getId().equals(user.getId());
        boolean isDoctor  = review.getAppointment().getBlock().getDoctor().getId().equals(user.getId());

        if (!isPatient && !isDoctor) {
            throw new ForbiddenException("You do not have permission to view this review.");
        }

        // Doctor always sees the patient's name; patient sees it only if the review is not anonymous
        return toResponse(review, isDoctor);
    }

    /**
     * Returns paginated reviews for a doctor identified by their public URL slug.
     */
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsByDoctorPublicId(String publicId, Pageable pageable) {
        DoctorProfile profile = doctorProfileRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found."));

        return reviewRepository
                .findByAppointment_Block_Doctor_IdOrderByCreatedAtDesc(profile.getUser().getId(), pageable)
                .map(review -> toResponse(review, false));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ReviewResponse toResponse(AppointmentReview review, boolean forceShowPatient) {
        User patient = review.getAppointment().getPatient();
        User doctor  = review.getAppointment().getBlock().getDoctor();

        String displayName = (!review.isAnonymous() || forceShowPatient)
                ? patient.getFirstName() + " " + patient.getLastName()
                : "Anonymous";

        return ReviewResponse.builder()
                .id(review.getId())
                .appointmentId(review.getAppointment().getId())
                .rating(review.getRating())
                .patientComment(review.getPatientComment())
                .doctorReply(review.getDoctorReply())
                .repliedAt(review.getRepliedAt())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .patientDisplayName(displayName)
                .doctorId(doctor.getId())
                .doctorFirstName(doctor.getFirstName())
                .doctorLastName(doctor.getLastName())
                .build();
    }
}
