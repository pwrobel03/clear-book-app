package com.clearbook.api.review.event;

import com.clearbook.api.repository.AppointmentReviewRepository;
import com.clearbook.api.repository.DoctorProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewStatsListener {

    private final AppointmentReviewRepository reviewRepository;
    private final DoctorProfileRepository profileRepository;

    @Async
    @EventListener
    @Transactional
    public void handleReviewChange(ReviewChangedEvent event) {
        profileRepository.findById(event.getDoctorId()).ifPresent(profile -> {
            Double avg = reviewRepository.calculateAverageRatingForDoctor(event.getDoctorId());
            Long count = reviewRepository.countReviewsForDoctor(event.getDoctorId());

            profile.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            profile.setTotalReviews(count.intValue());

            profileRepository.save(profile);
            log.info("Zaktualizowano statystyki lekarza {}: średnia={}, opinie={}", event.getDoctorId(), avg, count);
        });
    }
}