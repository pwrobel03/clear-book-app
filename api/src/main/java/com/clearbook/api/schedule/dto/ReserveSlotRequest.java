package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReserveSlotRequest {
    @NotNull private UUID blockId;
    @NotNull private UUID serviceId;
    @NotNull @Future private LocalDateTime startTime;
}