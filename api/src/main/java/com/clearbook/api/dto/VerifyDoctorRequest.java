package com.clearbook.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VerifyDoctorRequest {

    public enum Action {
        APPROVE, REJECT
    }

    @NotNull(message = "Verification i required (APPROVE or REJECT)")
    private Action action;
}