package com.clearbook.api.repository;

import com.clearbook.api.model.AvailabilityBlock;
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
}