package com.clearbook.api.repository;

import com.clearbook.api.model.AvailabilityBlock;
import com.clearbook.api.model.MedicalCenter;
import com.clearbook.api.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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
     * Only locks non-deleted blocks.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM AvailabilityBlock b WHERE b.id = :id AND b.isDeleted = false")
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
            "AND b.isDeleted = false " +
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
            "AND b.isDeleted = false " +
            "AND b.startTime < :endTime AND b.endTime > :startTime")
    boolean existsOverlappingBlockExcludingId(
            @Param("doctor") User doctor,
            @Param("blockId") UUID blockId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Used by the doctor's calendar to fetch their working blocks in a given timeframe.
     */
    @Query("SELECT b FROM AvailabilityBlock b WHERE b.doctor = :doctor " +
            "AND b.isDeleted = false " +
            "AND b.startTime BETWEEN :from AND :to " +
            "ORDER BY b.startTime ASC")
    List<AvailabilityBlock> findByDoctorAndStartTimeBetweenOrderByStartTimeAsc(
            @Param("doctor") User doctor,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    /**
     * PUBLIC: Fetches future blocks for a doctor by their user ID,
     * optionally bounded by a date range (for weekly calendar view).
     */
    @Query("SELECT b FROM AvailabilityBlock b WHERE b.doctor.id = :doctorId " +
            "AND b.isDeleted = false " +
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
     * Used by the "Clear Schedule" and "Plan Leave" features.
     */
    @Query("SELECT b FROM AvailabilityBlock b WHERE b.doctor = :doctor " +
            "AND b.isDeleted = false " +
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
            "AND b.center = :center AND b.isDeleted = false AND b.endTime > :now")
    List<AvailabilityBlock> findFutureBlocksByDoctorAndCenter(
            @Param("doctor") User doctor,
            @Param("center") MedicalCenter center,
            @Param("now") LocalDateTime now
    );

    // ── Soft-delete helpers ───────────────────────────────────────────────────

    /**
     * Marks a single block as deleted without touching the appointments FK.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE AvailabilityBlock b SET b.isDeleted = true WHERE b.id = :id")
    void softDeleteById(@Param("id") UUID id);

    /**
     * Marks multiple blocks as deleted in one statement.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE AvailabilityBlock b SET b.isDeleted = true WHERE b IN :blocks")
    void softDeleteAll(@Param("blocks") List<AvailabilityBlock> blocks);
}
