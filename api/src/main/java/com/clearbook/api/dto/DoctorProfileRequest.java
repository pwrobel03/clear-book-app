package com.clearbook.api.dto;

import com.clearbook.api.model.Specialization;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;

@Data
public class DoctorProfileRequest {

    @NotNull(message = "At least one specialization is required")
    private Set<Specialization> specializations;

    private String bio;

    private String licenseNumber;

    private boolean isPublic = true;
}
