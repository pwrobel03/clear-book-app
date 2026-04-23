package com.clearbook.api.repository;

import com.clearbook.api.model.AvailabilitySlot;
import com.clearbook.api.model.MedicalCenter;
import com.clearbook.api.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, UUID> {

    /** PESSIMISTIC LOCKING: Guarantees no Race Condition during reservation.
     * PostgreSQL will execute SELECT ... FOR UPDATE.
     **/
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM AvailabilitySlot s WHERE s.id = :id")
    Optional<AvailabilitySlot> findByIdWithPessimisticLock(@Param("id") UUID id);

    /** SLOT OVERLAP VALIDATION (Overlapping).
     * Returns true if there are any uncanceled slots in the given range for this doctor.
     **/
    @Query("SELECT COUNT(s) > 0 FROM AvailabilitySlot s " +
            "WHERE s.doctor = :doctor " +
            "AND s.status != 'CANCELLED' " +
            "AND (s.startTime < :endTime AND s.endTime > :startTime)")
    boolean existsOverlappingSlot(
            @Param("doctor") User doctor,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    /** PATIENT SEARCH: Retrieves only fully available appointments in the future,
     * at the selected facility, starting from the earliest.
     **/
    @Query("SELECT s FROM AvailabilitySlot s " +
            "WHERE s.doctor = :doctor AND s.center = :center " +
            "AND s.startTime > :now " +
            "AND (s.status = 'AVAILABLE' OR (s.status = 'RESERVED' AND s.lockedUntil < :now)) " +
            "ORDER BY s.startTime ASC")
    List<AvailabilitySlot> findAvailableSlots(
            @Param("doctor") User doctor,
            @Param("center") MedicalCenter center,
            @Param("now") LocalDateTime now
    );

    List<AvailabilitySlot> findByDoctorAndStartTimeBetweenOrderByStartTimeAsc(
            User doctor, LocalDateTime from, LocalDateTime to
    );
}