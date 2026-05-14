package com.clearbook.api.center.dto;

import com.clearbook.api.model.CenterType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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

    @Pattern(regexp = "^[+\\d][\\d\\s\\-().]{6,19}$", message = "Invalid phone number format")
    private String phone;

    @Email(message = "Invalid email address")
    private String email;

    private String website;

    @NotNull(message = "Center type is required")
    private CenterType type;
}
