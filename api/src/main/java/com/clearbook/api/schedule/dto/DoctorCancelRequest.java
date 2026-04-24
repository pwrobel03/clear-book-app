package com.clearbook.api.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DoctorCancelRequest {
    @NotBlank(message = "Reason for cancellation is required")
    private String reason;
}