package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class ConfirmAppointmentRequest {
    @NotNull private UUID appointmentId;
    private String patientNotes;
}