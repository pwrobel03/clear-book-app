package com.clearbook.api.repository;

import com.clearbook.api.model.AvailabilityBlock;
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
public interface AvailabilityBlockRepository extends JpaRepository<AvailabilityBlock, UUID> {

    /**
     * PESSIMISTIC LOCKING: Locks the entire working block during the booking process.
     * Prevents other transactions from booking any appointments in this block until finished.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM AvailabilityBlock b WHERE b.id = :id")
    Optional<AvailabilityBlock> findByIdWithPessimisticLock(@Param("id") UUID id);

    /**
     * VALIDATION: Checks if a doctor is trying to create a working block
     * that overlaps with an already existing working block.
     *
     * NOTE: Intentionally does NOT filter by center — a doctor cannot physically
     * be in two places at the same time, so overlapping blocks are blocked
     * regardless of which medical center they belong to.
     */
    @Query("SELECT COUNT(b) > 0 FROM AvailabilityBlock b " +
            "WHERE b.doctor = :doctor " +
            "AND (b.startTime < :endTime AND b.endTime > :startTime)")
    boolean existsOverlappingBlock(
            @Param("doctor") User doctor,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    /**
     * Same as {@link #existsOverlappingBlock} but excludes a specific block by ID.
     * Used when updating an existing block's time bounds to avoid false-positive
     * self-overlap detection.
     */
    @Query("SELECT COUNT(b) > 0 FROM AvailabilityBlock b WHERE b.doctor = :doctor " +
            "AND b.id != :blockId " +
            "AND b.startTime < :endTime AND b.endTime > :startTime")
    boolean existsOverlappingBlockExcludingId(
            @Param("doctor") User doctor,
            @Param("blockId") UUID blockId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Used by the doctor's calendar to fetch their working blocks in a given timeframe.
     */
    List<AvailabilityBlock> findByDoctorAndStartTimeBetweenOrderByStartTimeAsc(
            User doctor, LocalDateTime from, LocalDateTime to
    );

    /**
     * PUBLIC: Fetches future blocks for a doctor by their user ID,
     * optionally bounded by a date range (for weekly calendar view).
     * If rangeStart/rangeEnd are null, returns all future blocks.
     */
    @Query("SELECT b FROM AvailabilityBlock b WHERE b.doctor.id = :doctorId " +
            "AND b.endTime > :now " +
            "AND b.endTime > :rangeStart " +
            "AND b.startTime < :rangeEnd " +
            "ORDER BY b.startTime")
    List<AvailabilityBlock> findFutureBlocksByDoctorId(
            @Param("doctorId") UUID doctorId,
            @Param("now") LocalDateTime now,
            @Param("rangeStart") LocalDateTime rangeStart,
            @Param("rangeEnd") LocalDateTime rangeEnd
    );

    /**
     * Fetches blocks for a doctor within a date range, optionally filtered by center.
     * Used by the "Clear Schedule" feature to bulk-delete blocks.
     */
    @Query("SELECT b FROM AvailabilityBlock b WHERE b.doctor = :doctor " +
            "AND b.startTime >= :rangeStart AND b.startTime < :rangeEnd " +
            "AND (:center IS NULL OR b.center = :center) " +
            "ORDER BY b.startTime ASC")
    List<AvailabilityBlock> findBlocksInRange(
            @Param("doctor") User doctor,
            @Param("rangeStart") LocalDateTime rangeStart,
            @Param("rangeEnd") LocalDateTime rangeEnd,
            @Param("center") MedicalCenter center
    );

    /**
     * Fetches all future blocks for a doctor at a specific center.
     * Used when a doctor leaves a center — all their future availability must be removed.
     */
    @Query("SELECT b FROM AvailabilityBlock b WHERE b.doctor = :doctor " +
            "AND b.center = :center AND b.endTime > :now")
    List<AvailabilityBlock> findFutureBlocksByDoctorAndCenter(
            @Param("doctor") User doctor,
            @Param("center") MedicalCenter center,
            @Param("now") LocalDateTime now
    );
}