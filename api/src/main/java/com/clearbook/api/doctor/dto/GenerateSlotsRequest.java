package com.clearbook.api.doctor.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class GenerateSlotsRequest {

    @NotNull
    private UUID centerId;

    @NotNull
    @Future
    private LocalDateTime startTime;

    @NotNull
    @Future
    private LocalDateTime endTime;

    @Min(5)
    private int durationMinutes;

    @NotBlank
    private String visitType; // e.g., "USG", "Standard Consultation"
}