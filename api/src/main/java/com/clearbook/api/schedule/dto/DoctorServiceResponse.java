package com.clearbook.api.schedule.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Public view of a doctor's service offering.
 * Used by patients to select which service they want to book.
 */
@Data
@Builder
public class DoctorServiceResponse {
    private UUID id;
    private String name;
    private int durationMinutes;
    private BigDecimal price;
}
