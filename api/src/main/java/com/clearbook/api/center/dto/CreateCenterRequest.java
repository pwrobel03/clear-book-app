package com.clearbook.api.center.dto;

import com.clearbook.api.model.CenterType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCenterRequest {

    @NotBlank(message = "Center name is required")
    private String name;

    private String description;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    private String phone;
    private String email;
    private String website;

    @NotNull(message = "Center type is required")
    private CenterType type;
}
