package com.clearbook.api.review.event;

import com.clearbook.api.repository.AppointmentReviewRepository;
import com.clearbook.api.repository.DoctorProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewStatsListener {

    private final AppointmentReviewRepository reviewRepository;
    private final DoctorProfileRepository profileRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleReviewChange(ReviewChangedEvent event) {
        // We're looking up the doctor's profile by their user ID, which is more efficient than searching by public ID for this internal operation.
        profileRepository.findByUser_Id(event.getDoctorId()).ifPresent(profile -> {
            Double avg = reviewRepository.calculateAverageRatingForDoctor(event.getDoctorId());
            Long count = reviewRepository.countReviewsForDoctor(event.getDoctorId());

            profile.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            profile.setTotalReviews(count != null ? count.intValue() : 0);

            profileRepository.save(profile);
            log.info("Updated doctor statistics for {}: average={}, reviews={}", event.getDoctorId(), avg, count);
        });
    }
}