package com.clearbook.api.schedule.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AvailabilityBlockResponse {
    private UUID id;
    private UUID centerId;
    private String centerName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    /** Number of active (SCHEDULED or RESERVED) appointments inside this block. */
    private int appointmentCount;
}