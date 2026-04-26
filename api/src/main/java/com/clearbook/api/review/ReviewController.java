package com.clearbook.api.review;

import com.clearbook.api.model.User;
import com.clearbook.api.review.dto.DoctorReplyRequest;
import com.clearbook.api.review.dto.ReviewRequest;
import com.clearbook.api.review.dto.ReviewResponse;
import com.clearbook.api.shared.dto.MessageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // PATIENT: adding review for an appointment
    @PostMapping("/appointments/{appointmentId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal User patient,
            @PathVariable UUID appointmentId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.createReview(patient, appointmentId, request));
    }

    // PATIENT: Editing opinion for an appointment
    @PutMapping("/{reviewId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ReviewResponse> updateReview(
            @AuthenticationPrincipal User patient,
            @PathVariable UUID reviewId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.updateReview(patient, reviewId, request));
    }

    // PATIENT: removing review for an appointment
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<MessageResponse> deleteReview(
            @AuthenticationPrincipal User patient,
            @PathVariable UUID reviewId) {
        reviewService.deleteReview(patient, reviewId);
        return ResponseEntity.ok(new MessageResponse("Opinia usunięta."));
    }

    // DOCTOR / PATIENT: Getting review by appointment ID
    @GetMapping("/appointments/{appointmentId}")
    @PreAuthorize("hasAnyRole('USER', 'DOCTOR')")
    public ResponseEntity<ReviewResponse> getReviewByAppointment(
            @AuthenticationPrincipal User user,
            @PathVariable UUID appointmentId) {
        return ResponseEntity.ok(reviewService.getReviewByAppointmentId(user, appointmentId));
    }

    // DOCTOR: Responsd for review
    @PostMapping("/{reviewId}/reply")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ReviewResponse> replyToReview(
            @AuthenticationPrincipal User doctor,
            @PathVariable UUID reviewId,
            @Valid @RequestBody DoctorReplyRequest request) {
        return ResponseEntity.ok(reviewService.replyToReview(doctor, reviewId, request));
    }
}