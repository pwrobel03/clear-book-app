package com.clearbook.api.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VerifyDoctorRequest {

    public enum Action {
        APPROVE, REJECT
    }

    @NotNull(message = "Action is required (APPROVE or REJECT)")
    private Action action;
}
