package com.clearbook.api.review.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DoctorReplyRequest {
    @NotBlank(message = "Respond cannot be empty.")
    private String reply;
}