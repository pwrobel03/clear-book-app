package com.clearbook.api.repository;

import com.clearbook.api.model.Appointment;
import com.clearbook.api.model.AvailabilityBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

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
     * Bulk-cancels all RESERVED appointments whose hold timer has expired.
     * Used by the scheduled cleanup task to prevent zombie reservations from accumulating.
     *
     * @return the number of expired reservations that were cancelled
     */
    @Modifying
    @Transactional
    @Query("UPDATE Appointment a SET a.status = 'CANCELLED' " +
            "WHERE a.status = 'RESERVED' AND a.reservedUntil < CURRENT_TIMESTAMP")
    int cancelExpiredReservations();
}