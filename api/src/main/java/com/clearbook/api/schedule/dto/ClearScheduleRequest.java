package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Request to clear (delete) all working blocks within a date range.
 * Optionally scoped to a specific medical center.
 * All future appointments on affected blocks are automatically cancelled.
 */
@Data
public class ClearScheduleRequest {

    @NotNull
    private LocalDateTime rangeStart;

    @NotNull
    private LocalDateTime rangeEnd;

    /**
     * Optional: if provided, only blocks at this center are cleared.
     * If null, all blocks in the range are cleared regardless of center.
     */
    private UUID centerId;
}
