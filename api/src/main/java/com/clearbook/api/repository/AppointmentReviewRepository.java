package com.clearbook.api.repository;

import com.clearbook.api.model.AppointmentReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface AppointmentReviewRepository extends JpaRepository<AppointmentReview, UUID> {

    Optional<AppointmentReview> findByAppointmentId(UUID appointmentId);

    boolean existsByAppointmentId(UUID appointmentId);

    // Getting all reviews for a doctor by their ID, ordered by creation date in descending order.
    @Query("SELECT r FROM AppointmentReview r WHERE r.appointment.block.doctor.id = :doctorId ORDER BY r.createdAt DESC")
    Page<AppointmentReview> findAllByDoctorId(@Param("doctorId") UUID doctorId, Pageable pageable);
}