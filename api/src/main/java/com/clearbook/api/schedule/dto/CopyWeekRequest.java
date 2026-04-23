package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CopyWeekRequest {

    // Number of week marked as reference
    @NotNull
    private LocalDateTime sourceWeekStart;

    // How many week forward
    @Min(1)
    @Max(12) // Guard
    private int weeksToCopy;
}