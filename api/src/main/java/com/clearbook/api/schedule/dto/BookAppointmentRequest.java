package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.Future;
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

    // The exact time the patient clicked on in the frontend calendar
    @NotNull
    @Future
    private LocalDateTime startTime;

    private String patientNotes;
}