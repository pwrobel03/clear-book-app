package com.clearbook.api.repository;

import com.clearbook.api.model.Appointment;
import com.clearbook.api.model.AppointmentStatus;
import com.clearbook.api.model.AvailabilityBlock;
import com.clearbook.api.model.User;
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
     * It ignores CANCELLED appointments and RESERVED appointments whose 'reservedUntil' timer has expired.
     */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
            "WHERE a.block = :block " +
            "AND (a.status = 'SCHEDULED' OR a.status = 'COMPLETED' OR (a.status = 'RESERVED' AND a.reservedUntil > CURRENT_TIMESTAMP)) " +
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
     * Ordered by start time descending (most recent first).
     */
    @Query("SELECT a FROM Appointment a WHERE a.patient = :patient " +
            "AND (:status IS NULL OR a.status = :status) " +
            "ORDER BY a.startTime DESC")
    Page<Appointment> findByPatient(
            @Param("patient") User patient,
            @Param("status") AppointmentStatus status,
            Pageable pageable
    );

    /**
     * DOCTOR: Fetches the doctor's appointments (via block ownership), optionally filtered by status.
     * Ordered by start time ascending (chronological order for the day view).
     */
    @Query("SELECT a FROM Appointment a WHERE a.block.doctor = :doctor " +
            "AND (:status IS NULL OR a.status = :status) " +
            "ORDER BY a.startTime ASC")
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
}