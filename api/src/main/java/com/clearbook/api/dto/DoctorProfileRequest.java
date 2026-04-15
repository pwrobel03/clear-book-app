package com.clearbook.api.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.Set;

@Data
public class DoctorProfileRequest {

    /** Set of specialization codes, e.g. ["CARDIOLOGY", "NEUROLOGY"] */
    @NotEmpty(message = "At least one specialization is required")
    private Set<String> specializations;

    private String bio;

    private String licenseNumber;

    private boolean isPublic = true;
}
