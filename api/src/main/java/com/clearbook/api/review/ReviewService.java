package com.clearbook.api.review;

import com.clearbook.api.exception.ResourceNotFoundException;
import com.clearbook.api.model.*;
import com.clearbook.api.repository.AppointmentRepository;
import com.clearbook.api.repository.AppointmentReviewRepository;
import com.clearbook.api.review.dto.DoctorReplyRequest;
import com.clearbook.api.review.dto.ReviewRequest;
import com.clearbook.api.review.dto.ReviewResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Transactional
    public ReviewResponse createReview(User patient, UUID appointmentId, ReviewRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Review doesn't exist."));

        // Check role
        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new IllegalStateException("You can only rate your own appointment.");
        }

        // Check status
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("You can only leave a review after a completed appointment.");
        }

        // Protection before creating review
        if (reviewRepository.existsByAppointmentId(appointmentId)) {
            throw new IllegalStateException("A review for this appointment has already been submitted.");
        }

        AppointmentReview review = AppointmentReview.builder()
                .appointment(appointment)
                .rating(request.getRating())
                .patientComment(request.getComment())
                .isAnonymous(request.isAnonymous())
                .build();

        // If future: average rating calculation (e.g., EventPublisher)

        return toResponse(reviewRepository.save(review), false);
    }

    @Transactional
    public ReviewResponse updateReview(User patient, UUID reviewId, ReviewRequest request) {
        AppointmentReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review doesn't exist."));

        if (!review.getAppointment().getPatient().getId().equals(patient.getId())) {
            throw new IllegalStateException("You don't have permission to update this review.");
        }

        review.setRating(request.getRating());
        review.setPatientComment(request.getComment());
        review.setAnonymous(request.isAnonymous());

        // If future: average rating calculation (e.g., EventPublisher)

        return toResponse(reviewRepository.save(review), false);
    }

    @Transactional
    public void deleteReview(User patient, UUID reviewId) {
        AppointmentReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review doesn't exist."));

        if (!review.getAppointment().getPatient().getId().equals(patient.getId())) {
            throw new IllegalStateException("You don't have permission to delete this review.");
        }

        reviewRepository.delete(review);
        // In future: average rating calculation (e.g., EventPublisher)
    }

    @Transactional
    public ReviewResponse replyToReview(User doctor, UUID reviewId, DoctorReplyRequest request) {
        AppointmentReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review doesn't exist."));

        // Check if doctor is the owner of the review
        if (!review.getAppointment().getBlock().getDoctor().getId().equals(doctor.getId())) {
            throw new IllegalStateException("You can only respond to your own reviews.");
        }

        review.setDoctorReply(request.getReply());
        review.setRepliedAt(LocalDateTime.now());

        // true = wymuszamy widoczność danych pacjenta dla lekarza, niezależnie od isAnonymous
        return toResponse(reviewRepository.save(review), true);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getReviewByAppointmentId(User user, UUID appointmentId) {
        AppointmentReview review = reviewRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Review doesn't exist."));

        // Sprawdzamy, czy pytający to pacjent czy lekarz z tej wizyty
        boolean isPatient = review.getAppointment().getPatient().getId().equals(user.getId());
        boolean isDoctor = review.getAppointment().getBlock().getDoctor().getId().equals(user.getId());

        if (!isPatient && !isDoctor) {
            throw new IllegalStateException("You do not have permission to view this review.");
        }

        // Jeśli czyta to lekarz lub autor-pacjent, ignorujemy flagę anonimowości
        return toResponse(review, true);
    }

    // --- Helper mapujący ---
    private ReviewResponse toResponse(AppointmentReview review, boolean forceShowPatient) {
        User patient = review.getAppointment().getPatient();
        User doctor = review.getAppointment().getBlock().getDoctor();

        // LOGIKA ANONIMOWOŚCI
        String displayName;
        if (!review.isAnonymous() || forceShowPatient) {
            displayName = patient.getFirstName() + " " + patient.getLastName();
        } else {
            displayName = "Anonymous";
        }

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