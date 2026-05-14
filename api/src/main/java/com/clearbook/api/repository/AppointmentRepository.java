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
     * Uses JOIN FETCH to eagerly load block → doctor → doctorProfile and block → center,
     * eliminating N+1 queries when mapping publicId in AppointmentResponse.
     * Ordered by start time descending (most recent first).
     */
    @Query(value = "SELECT a FROM Appointment a " +
            "JOIN FETCH a.block b " +
            "JOIN FETCH b.doctor d " +
            "LEFT JOIN FETCH d.doctorProfile " +
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
     * Uses JOIN FETCH to eagerly load block → doctor → doctorProfile, center, service and patient,
     * eliminating N+1 queries when mapping publicId in AppointmentResponse.
     * Ordered by start time ascending (chronological order for the day view).
     */
    @Query(value = "SELECT a FROM Appointment a " +
            "JOIN FETCH a.block b " +
            "JOIN FETCH b.doctor d " +
            "LEFT JOIN FETCH d.doctorProfile " +
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

    /**
     * Counts active (SCHEDULED or non-expired RESERVED) appointments for a given block.
     * Used to populate appointmentCount in AvailabilityBlockResponse.
     */
    @Query("SELECT COUNT(a) FROM Appointment a " +
            "WHERE a.block = :block " +
            "AND (a.status = 'SCHEDULED' OR (a.status = 'RESERVED' AND a.reservedUntil > CURRENT_TIMESTAMP))")
    int countActiveAppointmentsByBlock(@Param("block") AvailabilityBlock block);

    boolean existsByService(DoctorService service);

    List<Appointment> findByStatusAndEndTimeBefore(AppointmentStatus status, LocalDateTime endTime);

    List<Appointment> findByStatusAndStartTimeBetweenAndReminderSentFalse(
            AppointmentStatus status,
            LocalDateTime startTimeStart,
            LocalDateTime startTimeEnd
    );

    // ── Reporting ─────────────────────────────────────────────────────────────

    /**
     * Counts appointments for a doctor grouped by status within a given period.
     * Returns rows of [status (String), count (Long)].
     */
    @Query("SELECT a.status, COUNT(a) FROM Appointment a " +
            "WHERE a.block.doctor = :doctor " +
            "AND a.startTime >= :from AND a.startTime < :to " +
            "GROUP BY a.status")
    List<Object[]> countByStatusForDoctor(
            @Param("doctor") User doctor,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    /**
     * Sums earnings (service price) for COMPLETED appointments within a period.
     * Returns null when there are no completed appointments.
     */
    @Query("SELECT COALESCE(SUM(a.service.price), 0) FROM Appointment a " +
            "WHERE a.block.doctor = :doctor " +
            "AND a.status = 'COMPLETED' " +
            "AND a.startTime >= :from AND a.startTime < :to")
    java.math.BigDecimal sumEarningsForDoctor(
            @Param("doctor") User doctor,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    /**
     * Returns top services by appointment count for COMPLETED appointments.
     * Rows: [serviceName (String), count (Long)].
     */
    @Query("SELECT a.service.name, COUNT(a) FROM Appointment a " +
            "WHERE a.block.doctor = :doctor " +
            "AND a.status = 'COMPLETED' " +
            "AND a.startTime >= :from AND a.startTime < :to " +
            "GROUP BY a.service.name " +
            "ORDER BY COUNT(a) DESC")
    List<Object[]> topServicesByDoctor(
            @Param("doctor") User doctor,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    /**
     * Per-center breakdown: center name, total appointments, completed count, earnings.
     * Rows: [centerName (String), total (Long), completed (Long), earnings (BigDecimal)].
     */
    @Query("SELECT b.center.name, COUNT(a), " +
            "SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
            "COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN a.service.price ELSE 0 END), 0) " +
            "FROM Appointment a " +
            "JOIN a.block b " +
            "WHERE b.doctor = :doctor " +
            "AND a.startTime >= :from AND a.startTime < :to " +
            "GROUP BY b.center.name " +
            "ORDER BY COUNT(a) DESC")
    List<Object[]> perCenterBreakdownForDoctor(
            @Param("doctor") User doctor,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}