package com.clearbook.api.schedule.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}