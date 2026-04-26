package com.clearbook.api.repository;

import com.clearbook.api.model.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    /**
     * VALIDATION FOR OVERLAPPING APPOINTMENTS.
     * Checks if there is any valid appointment.
     * Uses explicit inclusion (Whitelist) for safety.
     */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
            "WHERE a.block = :block " +
            "AND (a.status IN ('SCHEDULED', 'COMPLETED') OR (a.status = 'RESERVED' AND a.reservedUntil > CURRENT_TIMESTAMP)) " +
            "AND (a.startTime < :endTime AND a.endTime > :startTime)")
    boolean existsOverlappingAppointment(
            @Param("block") AvailabilityBlock block,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    /**
     * Fetches all active appointments for a specific block.
     * Useful for returning the schedule to the frontend so it can render the "free gaps".
     */
    @Query("SELECT a FROM Appointment a " +
            "WHERE a.block = :block AND a.status != 'CANCELLED' " +
            "ORDER BY a.startTime ASC")
    List<Appointment> findActiveAppointmentsByBlock(@Param("block") AvailabilityBlock block);

    List<Appointment> findByBlock(AvailabilityBlock block);

    /**
     * PATIENT: Fetches the patient's appointments, optionally filtered by status.
     * Uses JOIN FETCH to eagerly load block → doctor and block → center,
     * avoiding N+1 queries when mapping to AppointmentResponse.
     * Ordered by start time descending (most recent first).
     */
    @Query(value = "SELECT a FROM Appointment a " +
            "JOIN FETCH a.block b " +
            "JOIN FETCH b.doctor " +
            "JOIN FETCH b.center " +
            "JOIN FETCH a.service " +
            "WHERE a.patient = :patient " +
            "AND (:status IS NULL OR a.status = :status) " +
            "ORDER BY a.startTime DESC",
           countQuery = "SELECT COUNT(a) FROM Appointment a " +
            "WHERE a.patient = :patient " +
            "AND (:status IS NULL OR a.status = :status)")
    Page<Appointment> findByPatient(
            @Param("patient") User patient,
            @Param("status") AppointmentStatus status,
            Pageable pageable
    );

    /**
     * DOCTOR: Fetches the doctor's appointments (via block ownership), optionally filtered by status.
     * Uses JOIN FETCH to eagerly load the associated service for DTO mapping.
     * Ordered by start time ascending (chronological order for the day view).
     */
    @Query(value = "SELECT a FROM Appointment a " +
            "JOIN FETCH a.block b " +
            "JOIN FETCH b.doctor " +
            "JOIN FETCH b.center " +
            "JOIN FETCH a.service " +
            "JOIN FETCH a.patient " +
            "WHERE b.doctor = :doctor " +
            "AND (:status IS NULL OR a.status = :status) " +
            "ORDER BY a.startTime ASC",
           countQuery = "SELECT COUNT(a) FROM Appointment a " +
            "WHERE a.block.doctor = :doctor " +
            "AND (:status IS NULL OR a.status = :status)")
    Page<Appointment> findByDoctor(
            @Param("doctor") User doctor,
            @Param("status") AppointmentStatus status,
            Pageable pageable
    );

    /**
     * Bulk-cancels all RESERVED appointments whose hold timer has expired.
     * Used by the scheduled cleanup task to prevent zombie reservations from accumulating.
     *
     * @return the number of expired reservations that were cancelled
     */
    @Modifying
    @Query("UPDATE Appointment a SET a.status = 'CANCELLED' " +
            "WHERE a.status = 'RESERVED' AND a.reservedUntil < CURRENT_TIMESTAMP")
    int cancelExpiredReservations();

    boolean existsByService(DoctorService service);

    List<Appointment> findByStatusAndEndTimeBefore(AppointmentStatus status, LocalDateTime endTime);
}