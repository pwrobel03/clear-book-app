package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateWorkingBlockRequest {
    @NotNull
    private LocalDateTime newStartTime;

    @NotNull
    private LocalDateTime newEndTime;
}