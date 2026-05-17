package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class BookAppointmentRequest {
    @NotNull
    private UUID blockId;

    @NotNull
    private UUID serviceId;

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    private String patientNotes;
}