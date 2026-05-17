package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ReserveSlotRequest {
    @NotNull private UUID blockId;
    @NotNull private UUID serviceId;
    @NotNull @Future private LocalDateTime startTime;
}