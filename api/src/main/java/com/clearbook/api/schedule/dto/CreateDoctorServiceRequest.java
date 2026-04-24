package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateDoctorServiceRequest {
    @NotBlank
    private String name;

    @Min(15)
    private int durationMinutes;

    @NotNull
    @Min(0)
    private BigDecimal price;
}